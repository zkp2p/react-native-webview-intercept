export type NetworkAPI = 'fetch' | 'xhr' | 'html';

export interface NetworkEvent {
  type: 'network';
  api: NetworkAPI;

  request: {
    url: string;
    method?: string; // "GET", "POST" (undefined for <form> GET)
    headers: Record<string, string>;
    body?: string | null;
    cookie: string | null;
  };

  response: {
    url: string;
    status: number;
    headers: Record<string, string>;
    body: string | null; // "[binary]" / "[truncated]" if large
  };
}

export interface InterceptConfig {
  /** Capture window.fetch traffic (default true) */
  fetch?: boolean;
  /** Capture XMLHttpRequest traffic (default true) */
  xhr?: boolean;
  /** Capture classic HTML <form> submits (default true) */
  html?: boolean;
  /**
   * Largest response/request body (in bytes) that will be posted
   * to React-Native. Anything bigger becomes "[truncated]".
   * Default 1 MB.
   */
  maxBodyBytes?: number;
}
