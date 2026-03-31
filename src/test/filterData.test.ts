import { describe, it, expect } from 'vitest'
import type { GembaData } from '../types'

/**
 * フィルタリングロジックのユニットテスト
 * DataList に渡す前に App.tsx の useMemo で行われる処理を再現
 */
function filterData(
  dataList: GembaData[],
  searchName: string,
  startDate: string,
  endDate: string
): GembaData[] {
  return dataList.filter(d => {
    const nameMatch = d.name.toLowerCase().includes(searchName.toLowerCase())
    const dateMatch =
      (!startDate || d.date >= startDate) &&
      (!endDate || d.date <= endDate)
    return nameMatch && dateMatch
  })
}

const sampleData: GembaData[] = [
  { id: 1, name: 'A川上流', date: '2026-01-10', work: '測定', memo: '', waterLevel: 1, velocity: 1, area: 1, flow: '1.00', compareNotes: '' },
  { id: 2, name: 'B川下流', date: '2026-02-20', work: '測定', memo: '', waterLevel: 2, velocity: 2, area: 2, flow: '4.00', compareNotes: '' },
  { id: 3, name: 'A川下流', date: '2026-03-15', work: '測定', memo: '', waterLevel: 3, velocity: 3, area: 3, flow: '9.00', compareNotes: '' },
]

describe('フィルタリングロジック', () => {
  it('検索ワードなし・日付範囲なしは全件返す', () => {
    expect(filterData(sampleData, '', '', '')).toHaveLength(3)
  })

  it('現場名で部分一致フィルタリングできる', () => {
    const result = filterData(sampleData, 'A川', '', '')
    expect(result).toHaveLength(2)
    expect(result.every(d => d.name.includes('A川'))).toBe(true)
  })

  it('大文字小文字を区別しない', () => {
    const result = filterData(sampleData, 'a川', '', '')
    expect(result).toHaveLength(2)
  })

  it('開始日でフィルタリングできる', () => {
    const result = filterData(sampleData, '', '2026-02-01', '')
    expect(result).toHaveLength(2)
    expect(result.map(d => d.id)).toEqual([2, 3])
  })

  it('終了日でフィルタリングできる', () => {
    const result = filterData(sampleData, '', '', '2026-02-28')
    expect(result).toHaveLength(2)
    expect(result.map(d => d.id)).toEqual([1, 2])
  })

  it('開始日・終了日の範囲で絞り込める', () => {
    const result = filterData(sampleData, '', '2026-02-01', '2026-02-28')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('名前 + 日付を組み合わせてフィルタリングできる', () => {
    const result = filterData(sampleData, 'A川', '2026-03-01', '')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('A川下流')
  })

  it('マッチしない場合は空配列を返す', () => {
    expect(filterData(sampleData, 'Z川', '', '')).toHaveLength(0)
  })
})
