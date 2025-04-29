import {
  View,
  StyleSheet,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { InterceptWebView } from '../../src';
import { useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { RequestNotification } from './components/RequestNotification';

interface Notification {
  id: number;
  message: string;
}

const DEFAULT_USER_AGENT = Platform.select({
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  default: '',
});

export default function App() {
  const [url, setUrl] = useState(
    'https://wise.com/all-transactions?direction=OUTGOING'
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const webViewRef = useRef<WebView>(null);
  const notificationId = useRef(0);

  const handleSubmit = () => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    console.log('finalUrl', finalUrl);
    setUrl(finalUrl);
    webViewRef.current?.injectJavaScript(
      `window.location.href = '${finalUrl}'`
    );
  };

  const addNotification = (message: string) => {
    const id = notificationId.current++;
    setNotifications((prev) => [...prev, { id, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.urlContainer}>
        <TextInput
          style={styles.urlBar}
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity style={styles.goButton} onPress={handleSubmit}>
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.webviewContainer}>
        <InterceptWebView
          ref={webViewRef}
          source={{
            uri: 'https://wise.com/all-transactions?direction=OUTGOING',
          }}
          urlPatterns={[
            'https://wise.com/gateway/v1/profiles/\\S+/activities/list',
          ]}
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
            const method = payload.request.method;
            const urlIntercepted = payload.request.url;
            const truncatedUrl =
              urlIntercepted.length > 30
                ? urlIntercepted.substring(0, 30) + '...'
                : urlIntercepted;
            addNotification(`${method} ${truncatedUrl}`);
          }}
          style={styles.webview}
        />
      </View>
      <View style={styles.notificationContainer}>
        {notifications.map((notification) => (
          <RequestNotification
            key={notification.id}
            message={notification.message}
            onComplete={() => removeNotification(notification.id)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  urlContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlBar: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  goButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  notificationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
  },
});
