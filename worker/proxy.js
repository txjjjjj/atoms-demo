// Cloudflare Worker — BigModel (Anthropic-compatible) CORS proxy
//
// Why: open.bigmodel.cn's edge returns a malformed double
// `Access-Control-Allow-Origin` header for some origins/networks, which
// browsers reject. Server-side calls bypass CORS entirely, so this worker
// forwards the request to BigModel and returns clean CORS headers.
//
// The worker is a dumb passthrough — it stores no secrets. The user's
// BigModel token travels browser -> worker -> Bigmodel in the
// Authorization header and is never persisted.
const UPSTREAM = "https://open.bigmodel.cn/api/anthropic";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    // Only allow the paths the app uses (/v1/messages, /v1/messages?...).
    const target = UPSTREAM + url.pathname + url.search;

    // Forward the request, preserving method/headers/body.
    const fwdHeaders = new Headers(request.headers);
    fwdHeaders.set("Host", "open.bigmodel.cn");
    const init = {
      method: request.method,
      headers: fwdHeaders,
      redirect: "manual",
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const resp = await fetch(target, init);

    // Strip any CORS headers from upstream (the bug) and set our own.
    const outHeaders = new Headers();
    for (const [k, v] of resp.headers) {
      if (/^access-control-/i.test(k)) continue;
      outHeaders.set(k, v);
    }
    const c = corsHeaders(request);
    for (const [k, v] of Object.entries(c)) outHeaders.set(k, v);

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: outHeaders,
    });
  },
};

function corsHeaders(request) {
  // Echo back whatever headers the client requested, so the Anthropic SDK's
  // x-stainless-* / anthropic-* headers are all allowed.
  const requested = request.headers.get("Access-Control-Request-Headers") || "*";
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": requested,
    "Access-Control-Max-Age": "86400",
  };
}
