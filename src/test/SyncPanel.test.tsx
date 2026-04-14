import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GembaData } from '../types'

// SYNC_URL はモジュールロード時に const 確定するため、
// stubEnv → resetModules → 動的 import で再評価させる
vi.stubEnv('VITE_SYNC_URL', 'https://example.com')
vi.resetModules()
const { default: SyncPanel } = await import('../components/SyncPanel')

const sampleData: GembaData[] = [
  { id: 1, name: 'A川', date: '2026-01-10', work: '', memo: '', waterLevel: 1, velocity: 1, area: 1, flow: '1.00', compareNotes: '' },
]

function renderPanel(onDownload = vi.fn()) {
  render(<SyncPanel dataList={sampleData} onDownload={onDownload} />)
  return onDownload
}

beforeEach(() => {
  localStorage.clear()
})

describe('SyncPanel', () => {
  it('業務IDとパスワードの入力欄を表示する', () => {
    renderPanel()
    expect(screen.getByLabelText('業務ID')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
  })

  it('アップロード・ダウンロードボタンを表示する', () => {
    renderPanel()
    expect(screen.getByText('アップロード')).toBeInTheDocument()
    expect(screen.getByText('ダウンロード')).toBeInTheDocument()
  })

  it('業務IDが不正なときアップロードするとエラーメッセージが表示される', async () => {
    renderPanel()
    const input = screen.getByLabelText('業務ID')
    await userEvent.clear(input)
    await userEvent.type(input, 'ab') // 3文字未満
    await userEvent.click(screen.getByText('アップロード'))
    expect(screen.getByText(/3〜64文字/)).toBeInTheDocument()
  })

  it('業務IDが不正なときダウンロードするとエラーメッセージが表示される', async () => {
    renderPanel()
    const input = screen.getByLabelText('業務ID')
    await userEvent.clear(input)
    await userEvent.type(input, 'ab')
    await userEvent.click(screen.getByText('ダウンロード'))
    expect(screen.getByText(/3〜64文字/)).toBeInTheDocument()
  })
})
