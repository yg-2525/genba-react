import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '../contexts/ToastContext'
import CompareModal from '../components/CompareModal'
import type { GembaData } from '../types'

const data1: GembaData = {
  id: 1, name: 'A川', date: '2026-01-10', work: '測定', memo: '',
  waterLevel: 1.0, velocity: 2.0, area: 3.0, flow: '6.00', compareNotes: '',
}
const data2: GembaData = {
  id: 2, name: 'B川', date: '2026-02-20', work: '測定', memo: '',
  waterLevel: 3.0, velocity: 4.0, area: 5.0, flow: '20.00', compareNotes: '',
}

function renderModal(onSaveNotes = vi.fn(), onClose = vi.fn()) {
  render(
    <ToastProvider>
      <CompareModal data1={data1} data2={data2} onSaveNotes={onSaveNotes} onClose={onClose} />
    </ToastProvider>
  )
}

describe('CompareModal', () => {
  it('2件の現場名を表示する', () => {
    renderModal()
    expect(screen.getByText('A川')).toBeInTheDocument()
    expect(screen.getByText('B川')).toBeInTheDocument()
  })

  it('流量の差を正しく計算して表示する', () => {
    // 20.00 - 6.00 = 14.00
    renderModal()
    expect(screen.getByText('14.00')).toBeInTheDocument()
  })

  it('メモが空のとき onSaveNotes が呼ばれない', async () => {
    const onSaveNotes = vi.fn()
    renderModal(onSaveNotes)
    await userEvent.click(screen.getByText('メモを保存'))
    expect(onSaveNotes).not.toHaveBeenCalled()
  })

  it('メモを入力して保存すると onSaveNotes が正しい内容で呼ばれる', async () => {
    const onSaveNotes = vi.fn()
    renderModal(onSaveNotes)
    await userEvent.type(screen.getByPlaceholderText('比較メモを入力...'), 'テストメモ')
    await userEvent.click(screen.getByText('メモを保存'))
    expect(onSaveNotes).toHaveBeenCalledWith('テストメモ')
  })

  it('「閉じる」を押すと onClose が呼ばれる', async () => {
    const onClose = vi.fn()
    renderModal(vi.fn(), onClose)
    await userEvent.click(screen.getByText('閉じる'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
