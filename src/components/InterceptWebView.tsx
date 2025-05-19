import { forwardRef, useMemo } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import WebView, {
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';
import type { InterceptConfig, NetworkEvent } from '../types';
import { buildInjector } from '../helpers/injectorBuilder';
import CookieManager from '@react-native-cookies/cookies';

export interface InterceptWebViewProps
  extends Omit<
    WebViewProps,
    'onMessage' | 'injectedJavaScriptBeforeContentLoaded'
  > {
  /** Called whenever a packet whose URL passes any of the `urlPatterns` is intercepted. */
  onIntercept?: (evt: NetworkEvent) => void;
  /** Array of RegExp or string filters (runs on `evt.request.url`). */
  urlPatterns?: (RegExp | string)[];
  style?: ViewStyle | ViewStyle[];
  onMessage?: (event: WebViewMessageEvent) => void;
  interceptConfig?: InterceptConfig;
  additionalCookieDomainsToInclude?: string[];
}

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
    urlPatterns,
    onMessage,
    interceptConfig,
    additionalCookieDomainsToInclude,
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
  const regexes = useMemo(
    () => urlPatterns?.map((pattern) => compile(pattern)) ?? [],
    [urlPatterns]
  );

  const scriptKey = injector.length;

  const handleMessage = async (e: WebViewMessageEvent) => {
    try {
      const pkt: NetworkEvent = JSON.parse(e.nativeEvent.data);
      if (
        pkt.type === 'network' &&
        (!regexes.length ||
          regexes.some((regex) => regex?.test(pkt.request.url)))
      ) {
        let cookies = '';
        try {
          if (Platform.OS === 'android') {
            // Android: get cookies for the specific URL
            const cookieObj = await CookieManager.get(pkt.request.url);
            cookies = Object.entries(cookieObj)
              .map(([k, v]) => `${k}=${v.value}`)
              .join('; ');
          } else {
            // iOS: get all cookies, filter by domain using native URL
            let domain = '';
            try {
              domain = new URL(pkt.request.url).hostname;
            } catch {
              // fallback: extract domain with regex if URL parsing fails
              const match = pkt.request.url.match(/^https?:\/\/([^/]+)/);
              domain = match?.[1] ?? '';
            }

            const allCookies = await CookieManager.getAll(true);
            const filteredCookies = Object.entries(allCookies)
              .filter(([_, v]) => {
                if (!v.domain) return false; // Reject cookies without domain for safety

                // Remove leading dot for comparison
                const cookieDomain = v.domain.startsWith('.')
                  ? v.domain.slice(1)
                  : v.domain;
                const requestDomain = domain.toLowerCase();
                if (additionalCookieDomainsToInclude?.includes(cookieDomain)) {
                  return true;
                }

                // Only allow cookies if:
                // 1. Exact domain match
                // 2. Cookie domain is parent domain of request domain
                return (
                  requestDomain === cookieDomain ||
                  requestDomain.endsWith('.' + cookieDomain)
                );
              })
              .map(([k, v]) => `${k}=${v.value}`)
              .join('; ');
            cookies = filteredCookies;
          }
        } catch (err) {
          console.log('Error fetching cookies', err);
        }
        pkt.request.cookie = cookies;
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
      {...(Platform.OS === 'android' && urlPatterns
        ? {
            urlPatterns: urlPatterns.map((pattern) =>
              pattern instanceof RegExp ? pattern.toString() : pattern
            ) as any,
          }
        : null)}
      {...rest}
    />
  );
}

export const InterceptWebView = forwardRef(Base);
export default InterceptWebView;
