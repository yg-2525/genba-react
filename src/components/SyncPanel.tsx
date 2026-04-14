import { useState, useEffect } from 'react'
import type { GembaData } from '../types'

type Props = {
  dataList: GembaData[]
  onDownload: (data: GembaData[]) => void
}

const SYNC_URL = import.meta.env.VITE_SYNC_URL ?? ''
const KEY_PATTERN = /^[a-zA-Z0-9_\-]{3,64}$/

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function SyncPanel({ dataList, onDownload }: Props) {
  const [syncKey, setSyncKey] = useState(() => localStorage.getItem('syncKey') ?? '')
  const [syncPassword, setSyncPassword] = useState(() => localStorage.getItem('syncPassword') ?? '')
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info')
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState(() => localStorage.getItem('lastSync') ?? '')

  useEffect(() => {
    localStorage.setItem('syncKey', syncKey)
  }, [syncKey])

  useEffect(() => {
    localStorage.setItem('syncPassword', syncPassword)
  }, [syncPassword])

  if (!SYNC_URL) return null

  function showStatus(msg: string, type: 'info' | 'success' | 'error') {
    setStatus(msg)
    setStatusType(type)
  }

  async function handleUpload() {
    if (!KEY_PATTERN.test(syncKey)) {
      showStatus('業務IDは英数字・ハイフン・アンダースコア 3〜64文字で指定してください', 'error')
      return
    }
    if (dataList.length === 0) {
      showStatus('アップロードするデータがありません', 'error')
      return
    }
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (syncPassword) {
        headers['X-Sync-Password'] = await hashPassword(syncPassword)
      }
      const res = await fetch(`${SYNC_URL}/sync/${encodeURIComponent(syncKey)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ dataList }),
      })
      const data = await res.json()
      if (!res.ok) {
        showStatus(data.error ?? 'アップロード失敗', 'error')
        return
      }
      const now = new Date().toLocaleString('ja-JP')
      setLastSync(now)
      localStorage.setItem('lastSync', now)
      showStatus(`${data.count}件をアップロードしました`, 'success')
    } catch {
      showStatus('通信エラー: サーバーに接続できません', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    if (!KEY_PATTERN.test(syncKey)) {
      showStatus('業務IDは英数字・ハイフン・アンダースコア 3〜64文字で指定してください', 'error')
      return
    }
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (syncPassword) {
        headers['X-Sync-Password'] = await hashPassword(syncPassword)
      }
      const res = await fetch(`${SYNC_URL}/sync/${encodeURIComponent(syncKey)}`, { headers })
      const data = await res.json()
      if (!res.ok) {
        showStatus(data.error ?? 'ダウンロード失敗', 'error')
        return
      }
      if (!Array.isArray(data.dataList)) {
        showStatus('サーバーのデータ形式が不正です', 'error')
        return
      }
      onDownload(data.dataList)
      const now = new Date().toLocaleString('ja-JP')
      setLastSync(now)
      localStorage.setItem('lastSync', now)
      showStatus(`${data.dataList.length}件をダウンロードしました（ローカルデータを上書き）`, 'success')
    } catch {
      showStatus('通信エラー: サーバーに接続できません', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card sync-panel">
      <h2>データ同期</h2>
      <p className="sync-description">
        業務IDを共有して PC/モバイル間でデータを同期できます
      </p>
      <div className="sync-key-row">
        <label htmlFor="sync-key">業務ID</label>
        <input
          id="sync-key"
          type="text"
          value={syncKey}
          onChange={e => setSyncKey(e.target.value)}
          placeholder="例: kawaguchi-2026"
          maxLength={64}
          disabled={loading}
        />
      </div>
      <div className="sync-key-row">
        <label htmlFor="sync-password">パスワード</label>
        <input
          id="sync-password"
          type="password"
          value={syncPassword}
          onChange={e => setSyncPassword(e.target.value)}
          placeholder="任意（設定すると上書き保護）"
          maxLength={64}
          disabled={loading}
          autoComplete="off"
        />
      </div>
      <div className="sync-actions">
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={loading || !syncKey}
        >
          {loading ? '...' : 'アップロード'}
        </button>
        <button
          className="btn-secondary"
          onClick={handleDownload}
          disabled={loading || !syncKey}
        >
          {loading ? '...' : 'ダウンロード'}
        </button>
      </div>
      {status && (
        <p className={`sync-status sync-status-${statusType}`}>{status}</p>
      )}
      {lastSync && (
        <p className="sync-last">最終同期: {lastSync}</p>
      )}
    </section>
  )
}
