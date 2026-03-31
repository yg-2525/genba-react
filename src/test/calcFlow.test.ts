import { describe, it, expect } from 'vitest'

/**
 * 流量計算ロジックのユニットテスト
 * 流量 = 流速 × 断面積
 */
function calcFlow(velocity: number, area: number): string {
  return (velocity * area).toFixed(2)
}

describe('流量計算', () => {
  it('流速 × 断面積 を小数2桁で返す', () => {
    expect(calcFlow(2.5, 4.0)).toBe('10.00')
  })

  it('小数点を含む値でも正確に計算する', () => {
    expect(calcFlow(1.23, 3.45)).toBe('4.24')
  })

  it('どちらかが 0 のとき流量は 0.00', () => {
    expect(calcFlow(0, 5)).toBe('0.00')
    expect(calcFlow(3, 0)).toBe('0.00')
  })

  it('大きな値も扱える', () => {
    expect(calcFlow(10, 100)).toBe('1000.00')
  })
})
