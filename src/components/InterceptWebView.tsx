import { forwardRef, useMemo } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import WebView, {
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';
import type { InterceptConfig, NetworkEvent } from '../types';
import { buildInjector } from '../helpers/injectorBuilder';

export interface InterceptWebViewProps
  extends Omit<
    WebViewProps,
    'onMessage' | 'injectedJavaScriptBeforeContentLoaded'
  > {
  /** Called whenever a packet whose URL passes `urlPattern` is intercepted. */
  onIntercept?: (evt: NetworkEvent) => void;
  /** RegExp or string filter (runs on `evt.request.url`). */
  urlPattern?: RegExp | string;
  style?: ViewStyle | ViewStyle[];
  onMessage?: (event: WebViewMessageEvent) => void;
  interceptConfig?: InterceptConfig;
}

/* Util: string ⟷ RegExp */
const compile = (p?: RegExp | string | null) => {
  if (!p) return null;
  if (typeof p === 'string') {
    // Remove the need for double escaping by replacing \\ with \
    const cleanPattern = p.replace(/\\\\/g, '\\');
    return new RegExp(cleanPattern);
  }
  return p;
};

function Base(props: InterceptWebViewProps, ref: any) {
  const {
    onIntercept,
    urlPattern,
    onMessage,
    interceptConfig,
    originWhitelist = ['*'],
    javaScriptEnabled = true,
    domStorageEnabled = true,
    thirdPartyCookiesEnabled = true,
    setSupportMultipleWindows = false,
    startInLoadingState = true,
    ...rest
  } = props;

  const injector = useMemo(
    () => buildInjector(interceptConfig),
    [interceptConfig]
  );
  const regex = useMemo(() => compile(urlPattern), [urlPattern]);

  const scriptKey = injector.length;

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const pkt: NetworkEvent = JSON.parse(e.nativeEvent.data);
      if (pkt.type === 'network' && (!regex || regex.test(pkt.request.url))) {
        onIntercept?.(pkt);
      }
    } catch {} // swallow non-sdk messages
    onMessage?.(e);
  };

  return (
    <WebView
      key={scriptKey}
      ref={ref}
      originWhitelist={originWhitelist}
      injectedJavaScriptBeforeContentLoaded={injector}
      onMessage={handleMessage}
      javaScriptEnabled={javaScriptEnabled}
      domStorageEnabled={domStorageEnabled}
      thirdPartyCookiesEnabled={thirdPartyCookiesEnabled}
      setSupportMultipleWindows={setSupportMultipleWindows}
      startInLoadingState={startInLoadingState}
      {...(Platform.OS === 'android' && urlPattern
        ? {
            urlPattern: (urlPattern instanceof RegExp
              ? urlPattern.toString()
              : urlPattern) as any,
          }
        : null)}
      {...rest}
    />
  );
}

export const InterceptWebView = forwardRef(Base);
export default InterceptWebView;
