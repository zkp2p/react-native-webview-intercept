import { forwardRef, useMemo } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import WebView, {
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';
import { injectedScript } from '../helpers/injected';

export interface InterceptPayload {
  type: 'network';
  api: 'fetch' | 'xhr';
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string | null;
  };
  response: {
    url: string;
    status: number;
    headers: Record<string, string>;
    body: string | null;
  };
}

export interface InterceptWebViewProps extends Omit<WebViewProps, 'onMessage'> {
  onIntercept?: (payload: InterceptPayload) => void;
  urlPattern?: RegExp | string;
  style?: ViewStyle | ViewStyle[];
  onMessage?: (event: WebViewMessageEvent) => void;
}

function Component(
  { onIntercept, urlPattern, onMessage, ...rest }: InterceptWebViewProps,
  ref: any
) {
  const regex = useMemo(() => {
    if (!urlPattern) return null;
    return typeof urlPattern === 'string' ? new RegExp(urlPattern) : urlPattern;
  }, [urlPattern]);

  const passes = (url?: string) => {
    if (!regex) return true;
    return !!url && regex.test(url);
  };

  const forwardIfMatch = (payload: InterceptPayload) => {
    if (passes(payload.request.url)) onIntercept?.(payload);
  };

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const data: InterceptPayload = JSON.parse(e.nativeEvent.data);
      if (data && data.type === 'network') forwardIfMatch(data);
    } catch (_) {
      console.error('Error parsing intercepted message:', e.nativeEvent.data);
    }
    onMessage?.(e);
  };

  const patternForNative = useMemo(() => {
    if (!urlPattern) return undefined;
    if (urlPattern instanceof RegExp) return urlPattern.toString();
    return urlPattern;
  }, [urlPattern]);

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      injectedJavaScriptBeforeContentLoaded={injectedScript}
      onMessage={handleMessage}
      {...(Platform.OS === 'android'
        ? {
            urlPattern: patternForNative,
          }
        : {})}
      {...rest}
    />
  );
}

export const InterceptWebView = forwardRef(Component);
