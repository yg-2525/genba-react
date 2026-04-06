import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StatsPanel from '../components/StatsPanel'
import type { GembaData } from '../types'

const sampleData: GembaData[] = [
  { id: 1, name: 'A川', date: '2026-01-10', work: '測定', memo: '', waterLevel: 1.0, velocity: 2.0, area: 3.0, flow: '6.00', compareNotes: '' },
  { id: 2, name: 'B川', date: '2026-02-20', work: '測定', memo: '', waterLevel: 3.0, velocity: 4.0, area: 5.0, flow: '20.00', compareNotes: '' },
]

describe('StatsPanel', () => {
  it('dataList が空のとき何もレンダリングしない', () => {
    const { container } = render(<StatsPanel dataList={[]} onExportCSV={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('件数を正しく表示する', () => {
    render(<StatsPanel dataList={sampleData} onExportCSV={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('平均水位を正しく計算して表示する', () => {
    // (1.0 + 3.0) / 2 = 2.00
    render(<StatsPanel dataList={sampleData} onExportCSV={vi.fn()} />)
    expect(screen.getByText('2.00 m')).toBeInTheDocument()
  })

  it('平均流量を正しく計算して表示する', () => {
    // (6.00 + 20.00) / 2 = 13.00
    render(<StatsPanel dataList={sampleData} onExportCSV={vi.fn()} />)
    expect(screen.getByText('13.00 ㎥/s')).toBeInTheDocument()
  })

  it('CSV エクスポートボタンを押すと onExportCSV が呼ばれる', async () => {
    const onExportCSV = vi.fn()
    render(<StatsPanel dataList={sampleData} onExportCSV={onExportCSV} />)
    await userEvent.click(screen.getByText('CSV エクスポート'))
    expect(onExportCSV).toHaveBeenCalledOnce()
  })
})
