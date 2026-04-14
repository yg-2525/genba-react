/**
 * Cloudflare Worker: river.go.jp CORS プロキシ
 *
 * デプロイ手順:
 *   1. https://dash.cloudflare.com/ でアカウント作成（無料）
 *   2. Workers & Pages → Create Worker
 *   3. このファイルの内容を貼り付けて Deploy
 *   4. 取得した URL（例: https://river-proxy.xxx.workers.dev）を
 *      .env.production の VITE_WATER_LEVEL_SOURCE_URL に設定
 *
 * 無料枠: 100,000 リクエスト/日
 */

const ALLOWED_ORIGINS = [
  'https://yg-2525.github.io',
  'https://genba-react.pages.dev',
]
const UPSTREAM = 'https://www.river.go.jp'

// 許可するパスのプレフィックス（river.go.jp の API パスのみ通す）
const ALLOWED_PATHS = ['/api/search/', '/kawabou/file/files/']

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') ?? ''

    // プリフライト（OPTIONS）
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      })
    }

    // GET のみ許可
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const url = new URL(request.url)
    const path = url.pathname

    // 許可パス以外は拒否
    if (!ALLOWED_PATHS.some((prefix) => path.startsWith(prefix))) {
      return new Response('Forbidden', { status: 403 })
    }

    // upstream にリクエストを転送
    const upstreamUrl = `${UPSTREAM}${path}${url.search}`
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'genba-react-proxy',
        Accept: 'application/json',
      },
    })

    // レスポンスに CORS ヘッダーを付与して返す
    const responseHeaders = new Headers(upstreamResponse.headers)
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      responseHeaders.set(key, value)
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  },
}

function corsHeaders(origin) {
  // GitHub Pages, Cloudflare Pages, localhost のみ許可
  const allowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')

  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}
