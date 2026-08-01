# BigModel CORS 代理 (Cloudflare Worker)

`proxy.js` 是一个 Cloudflare Worker，把浏览器请求转发到 BigModel 的 Anthropic 兼容端点，并返回干净的 CORS 头，绕开 BigModel 边缘网关返回多个 `Access-Control-Allow-Origin` 导致浏览器拒绝的问题。

代理是纯转发，不存任何密钥。用户的 BigModel token 随 `Authorization` 头浏览器→Worker→BigModel，不落盘。

## 部署步骤（免费，约 2 分钟）

1. 注册/登录 Cloudflare：https://dash.cloudflare.com （免费，无需信用卡）
2. 左侧 **Workers & Pages** → **Create application** → **Create Worker**
3. 给 Worker 起个名（如 `atoms-proxy`）→ **Deploy**
4. 部署后点 **Edit code**，把 `proxy.js` 的全部内容粘贴进编辑器（覆盖默认代码）→ 右上角 **Deploy**
5. 复制 Worker 的 URL，形如 `https://atoms-proxy.<你的子域>.workers.dev`

## 接入应用

在 Atoms-Demo 的「设置」页，把 Worker URL 填入 **API 代理地址** 字段（例如 `https://atoms-proxy.xxx.workers.dev`），保存即可。应用会把 LLM 请求发到 `{Worker URL}/v1/messages`，由 Worker 转发到 BigModel。

（本地开发可留空 → 直连 BigModel；若本地也遇到 CORS，同样填 Worker URL。）
