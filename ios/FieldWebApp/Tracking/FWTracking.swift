//
//  FWTracking.swift
//  FieldWebApp
//
//  iOS side of task tracking for the React Native app.
//  Mirrors the Android TrackingForegroundService:
//   - starts when a task is accepted (JS: startTaskTracking), stops on check-out (JS: stopTaskTracking)
//   - a location tick every 2 minutes and a GPS/battery tick every 15 minutes, sent to JS as the
//     "FWTrackingTick" event; JS posts them to the server (trackingHeadlessTask.ts)
//   - the two tray notifications: "Location Updated: <time>" and "Service Running"
//
//  The ticks run on timers, not on location callbacks, so they still fire when the technician is
//  standing still (iOS can deliver few or no location updates then). iOS can only keep the app alive
//  in the background while location updates run ("location" background mode), which the continuous
//  updates started in begin() provide. The JS runtime keeps running in that same background period,
//  so the event reaches JS.
//
//  Tray notifications are posted natively at the start of every tick (not only when a fresh fix
//  arrives), the battery notification also refreshes whenever the battery level changes, and a
//  notification-center delegate lets them show while the app is open.
//

import Foundation
import UIKit
import CoreLocation
import UserNotifications
import React

@objc(FWTracking)
final class FWTracking: RCTEventEmitter, CLLocationManagerDelegate, UNUserNotificationCenterDelegate {

  static let locationInterval: TimeInterval = 2 * 60
  static let deviceInterval: TimeInterval = 15 * 60

  /// A cached fix older than this is not used for a tick (iOS can hand back old locations first).
  private static let maxFixAge: TimeInterval = 60

  /// How many times an unknown battery reading (-1) is retried before skipping that tick.
  private static let maxBatteryRetries = 3

  private static let eventName = "FWTrackingTick"
  private static let notificationPrefix = "fw.tracking."
  private static let locationNotificationId = "fw.tracking.location"
  private static let deviceNotificationId = "fw.tracking.device"
  private static let activeKey = "fw.tracking.active"
  private static let userIdKey = "fw.tracking.userId"
  private static let taskIdKey = "fw.tracking.taskId"

  private let manager = CLLocationManager()
  private var userId = ""
  private var taskId = 0
  private var running = false
  private var hasListeners = false

  private var locationTimer: DispatchSourceTimer?
  private var deviceTimer: DispatchSourceTimer?
  private var batteryObserver: NSObjectProtocol?
  /// Set when a location tick is due; cleared once a fresh fix has been emitted.
  private var pendingLocationFix = false
  /// Last position seen, so a tick can show coordinates before its own fresh fix arrives.
  private var lastCoordinate: CLLocationCoordinate2D?
  /// Last valid battery reading; used for location ticks and when a reading is momentarily unknown.
  private var lastBattery: Int?

  override init() {
    super.init()
    manager.delegate = self
    manager.desiredAccuracy = kCLLocationAccuracyBest
    manager.distanceFilter = kCLDistanceFilterNone
    manager.pausesLocationUpdatesAutomatically = false
    manager.activityType = .otherNavigation

    // Battery monitoring has to be on BEFORE the first read, otherwise batteryLevel is -1 (read as 0%).
    UIDevice.current.isBatteryMonitoringEnabled = true
    batteryObserver = NotificationCenter.default.addObserver(
      forName: UIDevice.batteryLevelDidChangeNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in self?.batteryLevelChanged() }

    // Lets the tray notifications be delivered while the app is open. Left alone if another
    // library already owns the delegate.
    let center = UNUserNotificationCenter.current()
    if center.delegate == nil { center.delegate = self }

    // The module is created when JS first touches it at launch. Resume if a task was being tracked.
    let defaults = UserDefaults.standard
    if defaults.bool(forKey: Self.activeKey) {
      userId = defaults.string(forKey: Self.userIdKey) ?? ""
      taskId = defaults.integer(forKey: Self.taskIdKey)
      begin()
    }
  }

  deinit {
    if let observer = batteryObserver {
      NotificationCenter.default.removeObserver(observer)
    }
  }

  // CLLocationManager must be created on the main thread.
  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String]! { [Self.eventName] }
  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  // MARK: - Bridge methods (see FWTracking.m)

  @objc(start:taskId:resolver:rejecter:)
  func start(_ userId: String,
             taskId: NSNumber,
             resolver resolve: @escaping RCTPromiseResolveBlock,
             rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard !userId.isEmpty else {
      reject("INVALID_USER", "userId is required", nil)
      return
    }
    self.userId = userId
    self.taskId = taskId.intValue

    let defaults = UserDefaults.standard
    defaults.set(true, forKey: Self.activeKey)
    defaults.set(userId, forKey: Self.userIdKey)
    defaults.set(self.taskId, forKey: Self.taskIdKey)

    begin()
    resolve(true)
  }

  @objc(stop:rejecter:)
  func stop(resolver resolve: @escaping RCTPromiseResolveBlock,
            rejecter reject: @escaping RCTPromiseRejectBlock) {
    UserDefaults.standard.set(false, forKey: Self.activeKey)
    stopTimers()
    manager.stopUpdatingLocation()
    manager.allowsBackgroundLocationUpdates = false
    running = false
    pendingLocationFix = false
    lastCoordinate = nil

    UNUserNotificationCenter.current().removeDeliveredNotifications(
      withIdentifiers: [Self.locationNotificationId, Self.deviceNotificationId]
    )
    resolve(true)
  }

  /// Android only pushes the fix into its notification from JS. On iOS the notification is already
  /// updated natively with the fix, so this is a no-op kept so the JS API matches on both platforms.
  @objc(reportLocation:latitude:longitude:resolver:rejecter:)
  func reportLocation(_ timestampMs: String,
                      latitude: Double,
                      longitude: Double,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(true)
  }

  // MARK: - Running

  private func begin() {
    guard !running, !userId.isEmpty else { return }
    running = true

    requestNotificationAuthorization()
    if manager.authorizationStatus == .notDetermined || manager.authorizationStatus == .authorizedWhenInUse {
      // Background tracking needs "Always". iOS shows the upgrade prompt when asked.
      manager.requestAlwaysAuthorization()
    }
    configureBackgroundUpdates()
    manager.startUpdatingLocation()

    // Like the Android tick on start: location and device status right away.
    startTimers()
    requestLocationTick()
    emitDevice(at: Date())
  }

  private func configureBackgroundUpdates() {
    let status = manager.authorizationStatus
    guard status == .authorizedAlways || status == .authorizedWhenInUse else { return }
    // Only "Always" keeps updates alive in the background. Requires the "location" background mode.
    manager.allowsBackgroundLocationUpdates = (status == .authorizedAlways)
    manager.showsBackgroundLocationIndicator = (status == .authorizedAlways)
  }

  // MARK: - Timers (Java: setupAlarm(120000) and the 15-minute GPSBatteryStatus alarm)

  private func startTimers() {
    stopTimers()

    let location = DispatchSource.makeTimerSource(queue: .main)
    location.schedule(deadline: .now() + Self.locationInterval,
                      repeating: Self.locationInterval,
                      leeway: .seconds(5))
    location.setEventHandler { [weak self] in self?.locationTimerFired() }
    location.resume()
    locationTimer = location

    let device = DispatchSource.makeTimerSource(queue: .main)
    device.schedule(deadline: .now() + Self.deviceInterval,
                    repeating: Self.deviceInterval,
                    leeway: .seconds(30))
    device.setEventHandler { [weak self] in self?.deviceTimerFired() }
    device.resume()
    deviceTimer = device
  }

  private func stopTimers() {
    locationTimer?.cancel()
    locationTimer = nil
    deviceTimer?.cancel()
    deviceTimer = nil
  }

  private func locationTimerFired() {
    guard running else { return }
    requestLocationTick()
  }

  private func deviceTimerFired() {
    guard running else { return }
    emitDevice(at: Date())
  }

  /// Asks for a fresh fix. The tick is emitted from didUpdateLocations when it arrives. The tray is
  /// updated right away, so "Location Updated" shows on every tick even if no fresh fix comes in.
  private func requestLocationTick() {
    pendingLocationFix = true
    showLocationNotification(at: Date(), coordinate: lastCoordinate)
    manager.requestLocation()
  }

  // MARK: - CLLocationManagerDelegate

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    if running { configureBackgroundUpdates() }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard running, let location = locations.last else { return }
    lastCoordinate = location.coordinate

    guard pendingLocationFix else { return }
    // Ignore stale cached fixes; wait for a fresh one.
    guard abs(location.timestamp.timeIntervalSinceNow) < Self.maxFixAge else { return }

    pendingLocationFix = false
    emitLocation(location, at: Date())
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("[FWTracking] location error: \(error)")
    // The next location tick requests a new fix, so a failed one is retried automatically.
  }

  // MARK: - Ticks

  private func emitLocation(_ location: CLLocation, at date: Date) {
    showLocationNotification(at: date, coordinate: location.coordinate)
    emit(kind: "location", date: date, gpsOn: gpsEnabled(), battery: currentBattery() ?? lastBattery ?? 0,
         latitude: location.coordinate.latitude, longitude: location.coordinate.longitude)
  }

  private func emitDevice(at date: Date, attempt: Int = 0) {
    guard let battery = currentBattery() else {
      // Unknown reading (-1): never post it as 0%. Show what we have and retry shortly.
      showDeviceNotification(gpsOn: gpsEnabled(), battery: lastBattery, at: date)
      if attempt < Self.maxBatteryRetries {
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
          guard let self = self, self.running else { return }
          self.emitDevice(at: Date(), attempt: attempt + 1)
        }
      }
      return
    }

    showDeviceNotification(gpsOn: gpsEnabled(), battery: battery, at: date)
    emit(kind: "device", date: date, gpsOn: gpsEnabled(), battery: battery,
         latitude: nil, longitude: nil)
  }

  /// Keeps the tray battery value live between the 15-minute server ticks. Tray only, no API call.
  private func batteryLevelChanged() {
    guard running, let battery = currentBattery() else { return }
    showDeviceNotification(gpsOn: gpsEnabled(), battery: battery, at: Date())
  }

  private func emit(kind: String, date: Date, gpsOn: Bool, battery: Int,
                    latitude: Double?, longitude: Double?) {
    guard hasListeners else { return }

    var body: [String: Any] = [
      "kind": kind,
      "userId": userId,
      "taskId": taskId,
      "batteryPercent": battery,
      "gpsOn": gpsOn,
      "timestamp": String(Int(date.timeIntervalSince1970 * 1000))
    ]
    if let latitude = latitude, let longitude = longitude {
      body["latitude"] = latitude
      body["longitude"] = longitude
    }
    sendEvent(withName: Self.eventName, body: body)
  }

  private func gpsEnabled() -> Bool {
    CLLocationManager.locationServicesEnabled()
  }

  /// nil when iOS does not know the level (-1: monitoring not ready yet, or a simulator).
  private func currentBattery() -> Int? {
    let device = UIDevice.current
    device.isBatteryMonitoringEnabled = true
    let level = device.batteryLevel
    guard level >= 0 else { return nil }
    let percent = Int((level * 100).rounded())
    lastBattery = percent
    return percent
  }

  // MARK: - Tray notifications

  private func requestNotificationAuthorization() {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert]) { _, _ in }
  }

  /// "Location Updated: <time>" with the position when known. Replaces the previous one in place.
  private func showLocationNotification(at date: Date, coordinate: CLLocationCoordinate2D?) {
    let content = UNMutableNotificationContent()
    content.title = "Location Updated: " + Self.formatTime(date, format: "dd-MMM-yyyy h:mm:ss a")
    content.body = "Updating your location..."
    if let coordinate = coordinate {
      content.subtitle = String(format: "Lat %.6f, Lng %.6f", coordinate.latitude, coordinate.longitude)
    }
    deliver(id: Self.locationNotificationId, content: content)
  }

  /// "Service Running" / "Monitoring GPS and Battery Status" with GPS and battery state.
  private func showDeviceNotification(gpsOn: Bool, battery: Int?, at date: Date) {
    let content = UNMutableNotificationContent()
    content.title = "Service Running"
    content.body = "Monitoring GPS and Battery Status"
    let batteryText = battery.map { "\($0)%" } ?? "--"
    content.subtitle = "GPS: \(gpsOn ? "On" : "Off") · Battery: \(batteryText) · Checked \(Self.formatTime(date, format: "h:mm a"))"
    deliver(id: Self.deviceNotificationId, content: content)
  }

  private func deliver(id: String, content: UNMutableNotificationContent) {
    content.sound = nil                                   // silent, like the Android channels
    if #available(iOS 15.0, *) {
      content.interruptionLevel = .passive                // goes to Notification Center, no banner
    }
    let center = UNUserNotificationCenter.current()
    center.removeDeliveredNotifications(withIdentifiers: [id])
    center.add(UNNotificationRequest(identifier: id, content: content, trigger: nil)) { error in
      if let error = error { print("[FWTracking] notification failed: \(error)") }
    }
  }

  // MARK: - UNUserNotificationCenterDelegate

  /// Without this, iOS drops these notifications while the app is in the foreground. They go to the
  /// Notification Center list only, no banner, so a 2-minute update does not pop up repeatedly.
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    if notification.request.identifier.hasPrefix(Self.notificationPrefix) {
      if #available(iOS 14.0, *) {
        completionHandler([.list])
      } else {
        completionHandler([])
      }
    } else {
      completionHandler([])
    }
  }

  private static func formatTime(_ date: Date, format: String) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = format
    return formatter.string(from: date)
      .replacingOccurrences(of: "AM", with: "am")
      .replacingOccurrences(of: "PM", with: "pm")
  }
}