/**
 * Cloudflare Worker: genba-sync (データ同期 API)
 *
 * KV にデータを保存し、業務IDで PC/モバイル間のデータ共有を実現する。
 *
 * デプロイ手順:
 *   1. Cloudflare ダッシュボード → Workers & Pages → KV
 *      → 名前空間「GENBA_SYNC」を作成し、ID をメモ
 *   2. wrangler.sync.toml の kv_namespaces.id にその ID を設定
 *   3. npx wrangler deploy -c wrangler.sync.toml
 *
 * エンドポイント:
 *   PUT  /sync/:key  — データをアップロード（最大 1MB）
 *   GET  /sync/:key  — データをダウンロード
 *
 * 認証: 業務ID（共有キー）をパスに含める
 * 制限: 1キーあたり最大 1MB、KV 無料枠 100,000 reads/day, 1,000 writes/day
 */

const ALLOWED_ORIGIN = 'https://yg-2525.github.io'
const MAX_BODY_SIZE = 1024 * 1024 // 1MB
const KEY_PATTERN = /^[a-zA-Z0-9_\-]{3,64}$/

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? ''

    // CORS プリフライト
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    const url = new URL(request.url)
    const match = url.pathname.match(/^\/sync\/([^/]+)$/)
    if (!match) {
      return jsonResponse(404, { error: 'Not found' }, origin)
    }

    const key = match[1]
    if (!KEY_PATTERN.test(key)) {
      return jsonResponse(400, { error: '業務IDは英数字・ハイフン・アンダースコア 3〜64文字で指定してください' }, origin)
    }

    if (!env.GENBA_SYNC) {
      return jsonResponse(500, { error: 'KV namespace not bound' }, origin)
    }

    switch (request.method) {
      case 'PUT':
        return handlePut(request, env, key, origin)
      case 'GET':
        return handleGet(env, key, origin)
      default:
        return jsonResponse(405, { error: 'Method not allowed' }, origin)
    }
  },
}

async function handlePut(request, env, key, origin) {
  const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10)
  if (contentLength > MAX_BODY_SIZE) {
    return jsonResponse(413, { error: 'データサイズが上限(1MB)を超えています' }, origin)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse(400, { error: '不正なJSONです' }, origin)
  }

  // dataList が配列であることをチェック
  if (!Array.isArray(body.dataList)) {
    return jsonResponse(400, { error: 'dataList が配列ではありません' }, origin)
  }

  // サイズ再チェック
  const serialized = JSON.stringify(body)
  if (serialized.length > MAX_BODY_SIZE) {
    return jsonResponse(413, { error: 'データサイズが上限(1MB)を超えています' }, origin)
  }

  const payload = {
    dataList: body.dataList,
    updatedAt: new Date().toISOString(),
  }

  // KV に保存（TTL なし = 無期限保存、過年度比較にも対応）
  await env.GENBA_SYNC.put(`sync:${key}`, JSON.stringify(payload))

  return jsonResponse(200, { ok: true, updatedAt: payload.updatedAt, count: body.dataList.length }, origin)
}

async function handleGet(env, key, origin) {
  const raw = await env.GENBA_SYNC.get(`sync:${key}`)
  if (!raw) {
    return jsonResponse(404, { error: 'この業務IDのデータはまだありません' }, origin)
  }

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return jsonResponse(500, { error: 'データの読み込みに失敗しました' }, origin)
  }

  return jsonResponse(200, data, origin)
}

function jsonResponse(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  })
}

function corsHeaders(origin) {
  const allowed =
    origin === ALLOWED_ORIGIN ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')

  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}
