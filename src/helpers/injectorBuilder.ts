import type { InterceptConfig } from '../types';

/* Escape *only* back-ticks so Metro / Hermes don’t mangle template strings */
const esc = (s: string) => s.replace(/`/g, '\\`');

export function buildInjector(cfg: InterceptConfig = {}): string {
  const {
    fetch = true,
    xhr = true,
    html = false,
    maxBodyBytes = 1_000_000,
  } = cfg;

  return esc(`
(function () {
  if (window.__INTERCEPT_SDK__) return;
  window.__INTERCEPT_SDK__ = 1;

  /* ────────────── config ────────────── */
  var ENABLE_FETCH = ${fetch};
  var ENABLE_XHR   = ${xhr};
  var ENABLE_HTML  = ${html};
  var MAX_BYTES    = ${maxBodyBytes};

  /* ───────── helpers ───────── */
  var RN   = window.ReactNativeWebView;
  var post = function (d) { RN && RN.postMessage(JSON.stringify(d)); };
  var toObj = function (h) { var o={}; h&&h.forEach(function(v,k){ o[k]=v; }); return o; };
  var sameOrigin = function (u) {
    try { return new URL(u, location.href).origin === location.origin; }
    catch (_) { return false; }
  };

  /* ─────────── FETCH ─────────── */
  if (ENABLE_FETCH && !window.fetch.__SDK_WRAPPED__) {
    var nativeFetch = window.fetch;
    window.fetch = new Proxy(nativeFetch, {
      apply: function (target, ctx, args) {
        var input  = args[0],
            init   = args[1] || {};
        var url    = (input && input.url) ? input.url : String(input);
        var method = (init.method || 'GET').toUpperCase();

        /* headers */
        var reqH = toObj(new Headers(init.headers || {}));
        if (typeof Request !== 'undefined' && input instanceof Request) {
          Object.assign(reqH, toObj(input.headers));
        }

        /* body capture */
        function captureReqBody () {
          if ('body' in init) {
            if (init.body == null)              return Promise.resolve(null);
            if (typeof init.body === 'string')
              return Promise.resolve(init.body.length > MAX_BYTES ? '[truncated]' : init.body);
            return Promise.resolve('[binary]');
          }
          if (typeof Request !== 'undefined' && input instanceof Request) {
            try {
              return input.clone().text().then(function (t) {
                return t.length > MAX_BYTES ? '[truncated]' : t;
              }).catch(function () { return '[binary]'; });
            } catch (_) { return Promise.resolve('[binary]'); }
          }
          return Promise.resolve(null);
        }

        var reqBody = null;

        return captureReqBody().then(function (resolved) {
          reqBody = resolved;

          return Reflect.apply(target, ctx, args).then(function (res) {
            var resH = toObj(res.headers);
            var mime = (res.headers.get('content-type') || '').toLowerCase();
            var respType =
                mime.indexOf('application/json')===0 ? 'json'  :
                mime.indexOf('text/html')===0        ? 'html'  :
                (mime.indexOf('text/xml')===0 || mime.indexOf('application/xml')===0 ||
                 mime.indexOf('image/svg+xml')===0)  ? 'xml'   :
                mime.indexOf('text/')===0            ? 'text'  :
                'binary';

            var resBody = null;
            return res.clone().blob().then(function (b) {
              if (b.size > MAX_BYTES) resBody='[truncated]';
              else if (/^text\\/|application\\/json/i.test(b.type))
                return b.text().then(function(t){ resBody=t; });
              else resBody='[binary]';
            }).catch(function(){})
            .then(function(){
              post({
                type:'network',
                api :'fetch',
                request :{
                  url:url, method:method, headers:reqH,
                  body:reqBody===undefined?null:reqBody,
                  cookie:sameOrigin(url)?(document.cookie||null):null
                },
                response:{
                  url:res.url, status:res.status, headers:resH,
                  body:resBody, type:respType
                }
              });
              return res;
            });
          });
        });
      }
    });
    window.fetch.__SDK_WRAPPED__ = 1;
    window.fetch.toString = function(){ return 'function fetch() { [native code] }'; };
  }

  /* ─────────── XHR ─────────── */
  if (ENABLE_XHR && !XMLHttpRequest.prototype.__SDK_PATCHED__) {
    var XHR = XMLHttpRequest.prototype;
    var open = XHR.open, send = XHR.send, setHeader = XHR.setRequestHeader;

    XHR.open = function (m,u){
      this.__meta = { method:m, url:u, headers:{} };
      return open.apply(this, arguments);
    };
    XHR.setRequestHeader = function(k,v){
      this.__meta.headers[k]=v;
      return setHeader.apply(this, arguments);
    };
    XHR.send = function(body){
      var meta=this.__meta;
      if (body && typeof body!=='string') body='[binary]';
      if (body && body.length>MAX_BYTES)  body='[truncated]';
      meta.body = body===undefined?null:body;
      meta.cookie = sameOrigin(meta.url)?(document.cookie||null):null;

      this.addEventListener('load', function(){
        var raw=this.getAllResponseHeaders().trim().split(/\\r?\\n/);
        var h={},i; for(i=0;i<raw.length;i++){
          var s=raw[i].split(': '); if(s[0]) h[s[0]]=s.slice(1).join(': ');
        }
        var txt=(this.responseType===''||this.responseType==='text')?this.responseText:'[binary]';
        if (txt.length>MAX_BYTES) txt='[truncated]';

        var mime=(h['content-type']||'').toLowerCase();
        var respType =
            mime.indexOf('application/json')===0 ? 'json':
            mime.indexOf('text/html')===0        ? 'html':
            (mime.indexOf('text/xml')===0||mime.indexOf('application/xml')===0||
             mime.indexOf('image/svg+xml')===0)  ? 'xml' :
            mime.indexOf('text/')===0            ? 'text':
            'binary';

        post({
          type:'network',
          api :'xhr',
          request :meta,
          response:{
            url:this.responseURL, status:this.status, headers:h,
            body:txt, type:respType
          }
        });
      });
      return send.apply(this, arguments);
    };
    XHR.__SDK_PATCHED__ = 1;
  }

  /* ─── Final HTML snapshot (optional) ─── */
  if (ENABLE_HTML) {
    window.addEventListener('load', function(){
      try{
        post({
          type:'network',
          api :'document',
          request :{
            url:location.href, method:'GET', headers:{},
            body:null, cookie:document.cookie||null
          },
          response:{
            url:location.href, status:200, headers:{},
            body:document.documentElement.outerHTML, type:'html'
          }
        });
      }catch(_){}
    }, {once:true});
  }
})();`);
}
