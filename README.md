# react-native-webview-intercept-sdk

Intercepts requests in webview

## Installation

```sh
yarn install react-native-webview-intercept
```

## Usage
See example app for usage

```js
import { InterceptWebView } from 'react-native-webview-intercept';

<InterceptWebView
    ref={webViewRef}
    source={{ uri: 'https://www.google.com' }}
    interceptConfig={{
        xhr: true,
        fetch: true,
        html: true,
        maxBodyBytes: 1024 * 1024 * 10,
    }}
    userAgent={DEFAULT_USER_AGENT}
    onNavigationStateChange={(navState) => {
        console.log('Navigation state:', navState);
    }}
    onLoadEnd={() => console.log('page done')}
    onError={(syntheticEvent) => {
        console.error('WebView error:', syntheticEvent.nativeEvent);
    }}
    onIntercept={(payload) => {
        console.log('➜ intercepted', payload);
    }}
    style={styles.webview}
/>
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
