export const injectedScript = `
(() => {
  if (window.__INTERCEPT_MARK__) return;
  window.__INTERCEPT_MARK__ = 1;

  const RN   = window.ReactNativeWebView;
  const post = data =>
    RN && RN.postMessage(JSON.stringify(data));

  /* ───────── helpers ───────── */
  const toPlainHeaders = h => {
    const o = {};
    h && h.forEach((v, k) => (o[k] = v));
    return o;
  };
  const SAFE_BODY_LIMIT = 1_000_000;      /* 1 MB – adjust if needed */

  /* ────── FETCH ───────────────────────── */
  const nativeFetch = window.fetch;
  window.fetch = new Proxy(nativeFetch, {
    async apply(target, thisArg, args) {
      const [input, init = {}] = args;

      /* request --------------- */
      const url    = input && input.url ? input.url : String(input);
      const method = (init.method || 'GET').toUpperCase();

      const reqHeaders = {};
      if (input instanceof Request) Object.assign(reqHeaders, toPlainHeaders(input.headers));
      Object.assign(reqHeaders, toPlainHeaders(new Headers(init.headers)));

      /* perform network -------- */
      const res = await Reflect.apply(target, thisArg, args);

      /* response -------------- */
      const resHeaders = toPlainHeaders(res.headers);
      let body = null;
      try {
        const blob = await res.clone().blob();
        if (blob.size <= SAFE_BODY_LIMIT && blob.type.startsWith('text/')) {
          body = await blob.text();
        }
      } catch { /* ignore opaque/binary */ }

      /* single post ------------ */
      post({
        type: 'network',
        api:  'fetch',
        request:  { url, method, headers: reqHeaders },
        response: { url: res.url, status: res.status, headers: resHeaders, body }
      });

      return res;
    }
  });
  window.fetch.toString = () => 'function fetch() { [native code] }';

  /* ────── XHR (optional) ───────────────── */
  const enableXHR = true;
  if (enableXHR && window.XMLHttpRequest) {
    const { open, send: xSend, setRequestHeader } = XMLHttpRequest.prototype;

    XMLHttpRequest.prototype.open = function (m, u) {
      this.__meta = { method: m, url: u, headers: {} };
      return open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
      this.__meta.headers[k] = v;
      return setRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      const meta = this.__meta;
      if (body != null && typeof body !== 'string') body = '[binary]';
      meta.body = body;

      this.addEventListener('load', () => {
        /* parse response headers string → object */
        const resHeaders = {};
        this.getAllResponseHeaders()
          .trim().split(/\\r?\\n/)
          .forEach(l => { const [k, v] = l.split(/: +/); if (k) resHeaders[k] = v; });

        const resBody = (this.responseType === '' || this.responseType === 'text')
          ? (this.responseText.length <= SAFE_BODY_LIMIT ? this.responseText : '[truncated]')
          : '[binary]';

        post({
          type: 'network',
          api:  'xhr',
          request:  meta,
          response: {
            url: this.responseURL,
            status: this.status,
            headers: resHeaders,
            body: resBody,
          }
        });
      });

      return xSend.apply(this, arguments);
    };
  }
})();
`;
