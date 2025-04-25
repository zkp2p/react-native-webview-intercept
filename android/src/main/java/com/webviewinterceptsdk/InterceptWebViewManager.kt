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

    @ReactProp(name = "urlPatterns")
    fun setUrlPatterns(view: RNCWebView, patterns: String?) {
        // Handle array of patterns
        // Implementation depends on how you're using the patterns in Android
    }
} 