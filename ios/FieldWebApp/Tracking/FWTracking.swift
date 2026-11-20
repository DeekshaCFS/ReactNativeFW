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

import Foundation
import UIKit
import CoreLocation
import UserNotifications
import React

@objc(FWTracking)
final class FWTracking: RCTEventEmitter, CLLocationManagerDelegate {

  static let locationInterval: TimeInterval = 2 * 60
  static let deviceInterval: TimeInterval = 15 * 60

  /// A cached fix older than this is not used for a tick (iOS can hand back old locations first).
  private static let maxFixAge: TimeInterval = 60

  private static let eventName = "FWTrackingTick"
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
  /// Set when a location tick is due; cleared once a fresh fix has been emitted.
  private var pendingLocationFix = false

  override init() {
    super.init()
    manager.delegate = self
    manager.desiredAccuracy = kCLLocationAccuracyBest
    manager.distanceFilter = kCLDistanceFilterNone
    manager.pausesLocationUpdatesAutomatically = false
    manager.activityType = .otherNavigation

    // The module is created when JS first touches it at launch. Resume if a task was being tracked.
    let defaults = UserDefaults.standard
    if defaults.bool(forKey: Self.activeKey) {
      userId = defaults.string(forKey: Self.userIdKey) ?? ""
      taskId = defaults.integer(forKey: Self.taskIdKey)
      begin()
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

  /// Asks for a fresh fix. The tick is emitted from didUpdateLocations when it arrives.
  private func requestLocationTick() {
    pendingLocationFix = true
    manager.requestLocation()
  }

  // MARK: - CLLocationManagerDelegate

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    if running { configureBackgroundUpdates() }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard running, pendingLocationFix, let location = locations.last else { return }
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
    let latitude = location.coordinate.latitude
    let longitude = location.coordinate.longitude
    let (gpsOn, battery) = deviceState()

    showLocationNotification(at: date, latitude: latitude, longitude: longitude)
    emit(kind: "location", date: date, gpsOn: gpsOn, battery: battery,
         latitude: latitude, longitude: longitude)
  }

  private func emitDevice(at date: Date) {
    let (gpsOn, battery) = deviceState()

    showDeviceNotification(gpsOn: gpsOn, battery: battery, at: date)
    emit(kind: "device", date: date, gpsOn: gpsOn, battery: battery,
         latitude: nil, longitude: nil)
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

  private func deviceState() -> (Bool, Int) {
    UIDevice.current.isBatteryMonitoringEnabled = true
    let level = UIDevice.current.batteryLevel            // -1 when unknown
    let battery = level < 0 ? 0 : Int((level * 100).rounded())
    return (CLLocationManager.locationServicesEnabled(), battery)
  }

  // MARK: - Tray notifications

  private func requestNotificationAuthorization() {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert]) { _, _ in }
  }

  /// "Location Updated: <time>" with the position. Replaces the previous one in place.
  private func showLocationNotification(at date: Date, latitude: Double, longitude: Double) {
    let content = UNMutableNotificationContent()
    content.title = "Location Updated: " + Self.formatTime(date, format: "dd-MMM-yyyy h:mm:ss a")
    content.body = "Updating your location..."
    content.subtitle = String(format: "Lat %.6f, Lng %.6f", latitude, longitude)
    deliver(id: Self.locationNotificationId, content: content)
  }

  /// "Service Running" / "Monitoring GPS and Battery Status" with GPS and battery state.
  private func showDeviceNotification(gpsOn: Bool, battery: Int, at date: Date) {
    let content = UNMutableNotificationContent()
    content.title = "Service Running"
    content.body = "Monitoring GPS and Battery Status"
    content.subtitle = "GPS: \(gpsOn ? "On" : "Off") · Battery: \(battery)% · Checked \(Self.formatTime(date, format: "h:mm a"))"
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

  private static func formatTime(_ date: Date, format: String) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = format
    return formatter.string(from: date)
      .replacingOccurrences(of: "AM", with: "am")
      .replacingOccurrences(of: "PM", with: "pm")
  }
}