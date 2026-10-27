package com.fieldwebapp

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

// The raw input of Java's HybridNetworkSpeedChecker: the active network's
// NetworkCapabilities.getLinkDownstreamBandwidthKbps() and its transport. JS applies the same
// thresholds Java does (networkQuality.ts).
class NetworkSpeedModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "FWNetworkSpeed"

  // Resolves { connected, transport: "wifi" | "cellular" | "other", downKbps }.
  @ReactMethod
  fun getNetworkInfo(promise: Promise) {
    try {
      val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
      val network = cm.activeNetwork
      val caps = if (network != null) cm.getNetworkCapabilities(network) else null
      val map = Arguments.createMap()
      if (caps == null) {
        map.putBoolean("connected", false)
        map.putString("transport", "other")
        map.putInt("downKbps", 0)
      } else {
        map.putBoolean("connected", true)
        map.putString(
          "transport",
          when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            else -> "other"
          },
        )
        map.putInt("downKbps", caps.linkDownstreamBandwidthKbps)
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("ERROR", e.message)
    }
  }
}

class NetworkSpeedPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) =
    listOf(NetworkSpeedModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
