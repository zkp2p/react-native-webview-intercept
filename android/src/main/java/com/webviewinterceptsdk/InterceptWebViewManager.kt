package com.webviewinterceptsdk

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.reactnativecommunity.webview.RNCWebView

class InterceptWebViewManager : SimpleViewManager<RNCWebView>() {
    override fun getName() = "InterceptWebView"

    override fun createViewInstance(reactContext: ThemedReactContext): RNCWebView {
        return RNCWebView(reactContext)
    }

    @ReactProp(name = "urlPattern")
    fun setUrlPattern(view: RNCWebView, pattern: String?) {
        // This is where we'll handle the URL pattern for Android
        // The actual implementation will depend on how you want to handle the pattern
    }
} 