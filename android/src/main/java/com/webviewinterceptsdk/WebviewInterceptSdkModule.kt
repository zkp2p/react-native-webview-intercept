package com.webviewinterceptsdk

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = WebviewInterceptSdkModule.NAME)
class WebviewInterceptSdkModule(reactContext: ReactApplicationContext) :
  NativeWebviewInterceptSdkSpec(reactContext) {

  override fun getName() = NAME

  companion object {
    const val NAME = "WebviewInterceptSdk"
  }
}
