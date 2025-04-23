package com.webviewinterceptsdk

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import java.util.HashMap

class WebviewInterceptSdkPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == WebviewInterceptSdkModule.NAME) WebviewInterceptSdkModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
      val infos = HashMap<String, ReactModuleInfo>()
      infos[WebviewInterceptSdkModule.NAME] = ReactModuleInfo(
          WebviewInterceptSdkModule.NAME,
          WebviewInterceptSdkModule.NAME,
          false, /* canOverride */
          false, /* eager */
          false, /* cxx */
          true   /* turbo */
      )
      infos
  }

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
      listOf(InterceptWebViewManager())
}