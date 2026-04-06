import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataList from '../components/DataList'
import type { GembaData } from '../types'

const sampleList: GembaData[] = [
  { id: 1, name: 'A川', date: '2026-01-10', work: '測定A', memo: '', waterLevel: 1, velocity: 1, area: 1, flow: '1.00', compareNotes: '' },
  { id: 2, name: 'B川', date: '2026-02-20', work: '測定B', memo: '', waterLevel: 2, velocity: 2, area: 2, flow: '4.00', compareNotes: '' },
]

describe('DataList', () => {
  it('filteredList が空のとき「データがありません」を表示する', () => {
    render(
      <DataList
        filteredList={[]}
        compareFirstIndex={null}
        onEdit={vi.fn()}
        onCompare={vi.fn()}
        onDelete={vi.fn()}
        onBulkDelete={vi.fn()}
      />
    )
    expect(screen.getByText('データがありません')).toBeInTheDocument()
  })

  it('データがあるとき現場名・日付を表示する', () => {
    render(
      <DataList
        filteredList={sampleList}
        compareFirstIndex={null}
        onEdit={vi.fn()}
        onCompare={vi.fn()}
        onDelete={vi.fn()}
        onBulkDelete={vi.fn()}
      />
    )
    expect(screen.getByText('A川')).toBeInTheDocument()
    expect(screen.getByText('B川')).toBeInTheDocument()
  })

  it('削除ボタンを押すとインライン確認 UI が表示される', async () => {
    render(
      <DataList
        filteredList={sampleList}
        compareFirstIndex={null}
        onEdit={vi.fn()}
        onCompare={vi.fn()}
        onDelete={vi.fn()}
        onBulkDelete={vi.fn()}
      />
    )
    const deleteButtons = screen.getAllByText('🗑️ 削除')
    await userEvent.click(deleteButtons[0])
    expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument()
  })

  it('確認 UI の「削除する」を押すと onDelete が呼ばれる', async () => {
    const onDelete = vi.fn()
    render(
      <DataList
        filteredList={sampleList}
        compareFirstIndex={null}
        onEdit={vi.fn()}
        onCompare={vi.fn()}
        onDelete={onDelete}
        onBulkDelete={vi.fn()}
      />
    )
    const deleteButtons = screen.getAllByText('🗑️ 削除')
    await userEvent.click(deleteButtons[0])
    await userEvent.click(screen.getByText('削除する'))
    expect(onDelete).toHaveBeenCalledWith(0)
  })

  it('確認 UI の「キャンセル」を押すと確認 UI が消える', async () => {
    render(
      <DataList
        filteredList={sampleList}
        compareFirstIndex={null}
        onEdit={vi.fn()}
        onCompare={vi.fn()}
        onDelete={vi.fn()}
        onBulkDelete={vi.fn()}
      />
    )
    const deleteButtons = screen.getAllByText('🗑️ 削除')
    await userEvent.click(deleteButtons[0])
    await userEvent.click(screen.getByText('キャンセル'))
    expect(screen.queryByText('本当に削除しますか？')).not.toBeInTheDocument()
  })
})