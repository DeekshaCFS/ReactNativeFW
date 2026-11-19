package com.fieldwebapp

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Runs the JS task that does the actual work for one tracking tick (location or GPS/battery).
 * Started by TrackingForegroundService; works while the React UI is not on screen.
 */
class TrackingHeadlessService : HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras ?: return null
        return HeadlessJsTaskConfig(TASK_NAME, Arguments.fromBundle(extras), TIMEOUT_MS, true)
    }

    companion object {
        // Must match AppRegistry.registerHeadlessTask('FWTrackingTick', ...) in index.js
        const val TASK_NAME = "FWTrackingTick"
        private const val TIMEOUT_MS = 30_000L
    }
}