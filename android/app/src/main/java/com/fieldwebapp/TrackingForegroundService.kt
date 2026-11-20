package com.fieldwebapp

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.LocationManager
import android.os.BatteryManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Keeps task tracking alive while a technician has an accepted task.
 *
 * Port of the Java app's task alarm:
 *  - setupAlarm(120000) + GoogleLocAlarmReceiver + GoogleLocationService -> a location tick every 2 minutes
 *  - AlarmReceiver + GPSBatteryStatus                                     -> a GPS/battery tick every 15 minutes
 *
 * Each tick is handed to the JS headless task (TrackingHeadlessService, task "FWTrackingTick"), which
 * reads the position and posts it to the server. This service runs in the foreground, and holds a
 * partial wake lock while a task is active so the ticks still fire with the screen off.
 */
class TrackingForegroundService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var userId: String = ""
    private var taskId: Int = 0
    private var wakeLock: PowerManager.WakeLock? = null

    private val locationTick = object : Runnable {
        override fun run() {
            dispatch(KIND_LOCATION)
            handler.postDelayed(this, LOCATION_INTERVAL_MS)
        }
    }

    private val deviceTick = object : Runnable {
        override fun run() {
            dispatch(KIND_DEVICE)
            handler.postDelayed(this, DEVICE_INTERVAL_MS)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopTracking()
                return START_NOT_STICKY
            }
            ACTION_START -> {
                userId = intent.getStringExtra(EXTRA_USER_ID).orEmpty()
                taskId = intent.getIntExtra(EXTRA_TASK_ID, 0)
                getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                    .putBoolean(KEY_ACTIVE, true)
                    .putString(KEY_USER_ID, userId)
                    .putInt(KEY_TASK_ID, taskId)
                    .apply()
            }
            else -> {
                // Restarted by the system after the process was killed: resume only if still active.
                val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
                if (!prefs.getBoolean(KEY_ACTIVE, false)) {
                    stopSelf()
                    return START_NOT_STICKY
                }
                userId = prefs.getString(KEY_USER_ID, "").orEmpty()
                taskId = prefs.getInt(KEY_TASK_ID, 0)
            }
        }
        startTracking()
        return START_STICKY
    }

    private fun startTracking() {
        startAsForeground(
            TrackingNotifications.locationNotification(this, System.currentTimeMillis(), "Updating your location...", null)
        )
        handler.removeCallbacksAndMessages(null)
        holdWakeLock()
        // The first location and status go out right away, then every 2 minutes (location)
        // and every 15 minutes (GPS/battery).
        handler.post(locationTick)
        handler.post(deviceTick)
    }

    private fun startAsForeground(notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                TrackingNotifications.LOCATION_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } else {
            startForeground(TrackingNotifications.LOCATION_NOTIFICATION_ID, notification)
        }
    }

    private fun dispatch(kind: String) {
        // Renewed on every tick, so the CPU stays awake long enough for the JS task to finish.
        holdWakeLock()

        val now = System.currentTimeMillis()
        val battery = batteryPercent()
        val gpsOn = isGpsOn()

        if (kind == KIND_DEVICE) {
            TrackingNotifications.postDevice(this, gpsOn, battery, now)
        }

        val intent = Intent(this, TrackingHeadlessService::class.java).apply {
            putExtra("kind", kind)
            putExtra("userId", userId)
            putExtra("taskId", taskId)
            putExtra("batteryPercent", battery)
            putExtra("gpsOn", gpsOn)
            putExtra("timestamp", now.toString())
        }
        try {
            startService(intent)
        } catch (e: Exception) {
            // Background start refused by the system. The next tick tries again.
        }
    }

    private fun holdWakeLock() {
        val lock = wakeLock ?: (getSystemService(Context.POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "$packageName:tracking")
            .apply { setReferenceCounted(false) }
            .also { wakeLock = it }
        lock.acquire(WAKE_LOCK_TIMEOUT_MS)
    }

    private fun releaseWakeLock() {
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = null
    }

    private fun batteryPercent(): Int {
        val manager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return manager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun isGpsOn(): Boolean {
        val manager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return manager.isProviderEnabled(LocationManager.GPS_PROVIDER)
    }

    private fun stopTracking() {
        handler.removeCallbacksAndMessages(null)
        releaseWakeLock()
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(KEY_ACTIVE, false).apply()
        stopForeground(STOP_FOREGROUND_REMOVE)
        NotificationManagerCompat.from(this).cancel(TrackingNotifications.DEVICE_NOTIFICATION_ID)
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        releaseWakeLock()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START = "com.fieldwebapp.tracking.START"
        const val ACTION_STOP = "com.fieldwebapp.tracking.STOP"
        const val EXTRA_USER_ID = "userId"
        const val EXTRA_TASK_ID = "taskId"
        const val KIND_LOCATION = "location"
        const val KIND_DEVICE = "device"

        const val LOCATION_INTERVAL_MS = 2 * 60 * 1000L
        const val DEVICE_INTERVAL_MS = 15 * 60 * 1000L
        const val WAKE_LOCK_TIMEOUT_MS = 5 * 60 * 1000L

        const val PREFS = "fw_tracking"
        const val KEY_ACTIVE = "active"
        const val KEY_USER_ID = "userId"
        const val KEY_TASK_ID = "taskId"
    }
}

/**
 * The two notifications shown in the tray (same as the Java app):
 *  - "Location Updated: <time>" / "Updating your location..." (ongoing, actions: Open, Remove Updates)
 *  - "Service Running" / "Monitoring GPS and Battery Status" with GPS and battery state (silent, low importance)
 */
object TrackingNotifications {
    const val LOCATION_CHANNEL_ID = "location_updates"
    const val DEVICE_CHANNEL_ID = "gps_battery_channel"
    const val LOCATION_NOTIFICATION_ID = 1001
    const val DEVICE_NOTIFICATION_ID = 1002

    fun locationNotification(context: Context, whenMs: Long, text: String, bigText: String?): Notification {
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val openPending = launch?.let {
            PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }
        val removeIntent = Intent(context, TrackingForegroundService::class.java)
            .setAction(TrackingForegroundService.ACTION_STOP)
        val removePending = PendingIntent.getService(
            context, 2, removeIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val title = "Location Updated: " + formatTitleTime(whenMs)

        val builder = NotificationCompat.Builder(context, LOCATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.assets_images_fw_logo)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(openPending)
            .addAction(R.drawable.assets_images_fw_logo, "Open", openPending)
            .addAction(R.drawable.assets_images_fw_logo, "Remove Updates", removePending)
            .setWhen(whenMs)
            .setShowWhen(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        if (bigText != null) {
            builder.setStyle(NotificationCompat.BigTextStyle().bigText("$text\n$bigText"))
        }
        return builder.build()
    }

    fun deviceNotification(context: Context, gpsOn: Boolean, battery: Int, whenMs: Long): Notification {
        val time = SimpleDateFormat("h:mm a", Locale.ENGLISH).format(Date(whenMs)).toAmPmLowercase()
        val detail = "GPS: ${if (gpsOn) "On" else "Off"} · Battery: $battery% · Checked $time"
        return NotificationCompat.Builder(context, DEVICE_CHANNEL_ID)
            .setSmallIcon(R.drawable.assets_images_fw_logo)
            .setContentTitle("Service Running")
            .setContentText("Monitoring GPS and Battery Status")
            .setStyle(NotificationCompat.BigTextStyle().bigText("Monitoring GPS and Battery Status\n$detail"))
            .setWhen(whenMs)
            .setShowWhen(false)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    /** Called from JS once a fix is read, so the tray shows the time and position of the last update. */
    fun postLocation(context: Context, whenMs: Long, latitude: Double, longitude: Double) {
        val coords = "Lat ${"%.6f".format(Locale.ENGLISH, latitude)}, Lng ${"%.6f".format(Locale.ENGLISH, longitude)}"
        notify(context, LOCATION_NOTIFICATION_ID, locationNotification(context, whenMs, "Updating your location...", coords))
    }

    fun postDevice(context: Context, gpsOn: Boolean, battery: Int, whenMs: Long) {
        notify(context, DEVICE_NOTIFICATION_ID, deviceNotification(context, gpsOn, battery, whenMs))
    }

    private fun formatTitleTime(whenMs: Long): String =
        SimpleDateFormat("dd-MMM-yyyy h:mm:ss a", Locale.ENGLISH).format(Date(whenMs)).toAmPmLowercase()

    private fun String.toAmPmLowercase(): String = replace("AM", "am").replace("PM", "pm")

    @SuppressLint("MissingPermission")
    private fun notify(context: Context, id: Int, notification: Notification) {
        createChannels(context)
        try {
            NotificationManagerCompat.from(context).notify(id, notification)
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS denied: tracking still runs, the tray just stays empty.
        }
    }

    private fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        manager.createNotificationChannel(
            NotificationChannel(LOCATION_CHANNEL_ID, "Location updates", NotificationManager.IMPORTANCE_DEFAULT).apply {
                setSound(null, null)
                enableVibration(false)
            }
        )
        manager.createNotificationChannel(
            NotificationChannel(DEVICE_CHANNEL_ID, "GPS and Battery Service", NotificationManager.IMPORTANCE_LOW)
        )
    }
}