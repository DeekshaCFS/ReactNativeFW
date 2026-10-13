package com.fieldwebapp

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.uimanager.ViewManager

// Port of Java BiometricAuthHelper / LoginTouchlessActivity.authenticateBiometric():
// BIOMETRIC_WEAK | DEVICE_CREDENTIAL so face unlock and the device PIN both work.
class BiometricAuthModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val authenticators =
    BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL

  override fun getName() = "FWBiometric"

  @ReactMethod
  fun isAvailable(promise: Promise) {
    val result = BiometricManager.from(reactContext).canAuthenticate(authenticators)
    promise.resolve(result == BiometricManager.BIOMETRIC_SUCCESS)
  }

  // Resolves true on success; rejects with code "CANCELED" / "ERROR" and the system message.
  @ReactMethod
  fun authenticate(title: String, subtitle: String, description: String, promise: Promise) {
    val activity = reactContext.currentActivity as? FragmentActivity
    if (activity == null) {
      promise.reject("ERROR", "No activity")
      return
    }
    activity.runOnUiThread {
      try {
        val prompt = BiometricPrompt(
          activity,
          ContextCompat.getMainExecutor(activity),
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
              promise.resolve(true)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              val canceled = errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                errorCode == BiometricPrompt.ERROR_CANCELED
              promise.reject(if (canceled) "CANCELED" else "ERROR", errString.toString())
            }
            // onAuthenticationFailed: leave the prompt open so the user can retry.
          },
        )
        val info = BiometricPrompt.PromptInfo.Builder()
          .setTitle(title)
          .setSubtitle(subtitle)
          .setDescription(description)
          .setAllowedAuthenticators(authenticators)
          .build()
        prompt.authenticate(info)
      } catch (e: Exception) {
        promise.reject("ERROR", e.message)
      }
    }
  }
}

class BiometricAuthPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) =
    listOf(BiometricAuthModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
