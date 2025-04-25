# react-native-webview-intercept

Intercepts requests in webview and returns the request and response payloads to the host app. Works for fetch, xhr, and html form submissions. Supports existing webview props.

Package is under heavy development and subject to change.

## Installation

```sh
yarn add @zkp2p/react-native-webview-intercept
yarn add react-native-webview # peer dependency
```

## Usage
See example app for usage

```js
import { InterceptWebView } from '@zkp2p/react-native-webview-intercept';

<InterceptWebView
    ref={webViewRef}
    source={{ uri: 'https://account.venmo.com/?feed=mine' }}
    interceptConfig={{
        xhr: true,
        fetch: true,
        html: true,
        maxBodyBytes: 1024 * 1024 * 10,
    }}
    urlPatterns={['https://account.venmo.com/api/stories\\?feedType=me&externalId=\\S+']}
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
