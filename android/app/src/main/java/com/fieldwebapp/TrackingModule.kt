package com.fieldwebapp

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

/** JS entry point: start / stop the task tracking service and push the location to the tray. */
class TrackingModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "FWTracking"

    @ReactMethod
    fun start(userId: String, taskId: Int, promise: Promise) {
        val hasLocation = ContextCompat.checkSelfPermission(
            reactContext, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (!hasLocation) {
            promise.reject("NO_LOCATION_PERMISSION", "Location permission is required for task tracking")
            return
        }
        val intent = Intent(reactContext, TrackingForegroundService::class.java).apply {
            action = TrackingForegroundService.ACTION_START
            putExtra(TrackingForegroundService.EXTRA_USER_ID, userId)
            putExtra(TrackingForegroundService.EXTRA_TASK_ID, taskId)
        }
        try {
            ContextCompat.startForegroundService(reactContext, intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        // Clear the saved state first, so a later system restart does not resume tracking after check-out.
        reactContext.getSharedPreferences(TrackingForegroundService.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(TrackingForegroundService.KEY_ACTIVE, false)
            .apply()
        try {
            reactContext.startService(
                Intent(reactContext, TrackingForegroundService::class.java).apply {
                    action = TrackingForegroundService.ACTION_STOP
                }
            )
        } catch (e: Exception) {
            // Service not running (already stopped or killed): nothing to stop.
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun reportLocation(timestampMs: String, latitude: Double, longitude: Double, promise: Promise) {
        TrackingNotifications.postLocation(reactContext, timestampMs.toLongOrNull() ?: System.currentTimeMillis(), latitude, longitude)
        promise.resolve(true)
    }
}

class TrackingPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext) =
        listOf(TrackingModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}