import { describe, expect, it } from 'vitest'
import {
  calculateObservationSummary,
  calcPointVelocity,
  type CalculationSettings,
  type ObservationInputRow,
} from '../utils/observation'

const settings: CalculationSettings = {
  coefficient: 0.163,
  offset: 0.008,
  pulseFactor: 5,
}

describe('observation calculator', () => {
  it('音数と秒数平均から点流速を計算できる', () => {
    expect(calcPointVelocity(11, 23.6, settings)).toBe(0.388)
  })

  it('観測行から断面積と流量を集計できる', () => {
    const rows: ObservationInputRow[] = [
      { id: '1', pointType: 'measured', distance: '0', depth: '0', count: '0', seconds1: '0', seconds2: '' },
      { id: '2', pointType: 'measured', distance: '2', depth: '0.8', count: '11', seconds1: '23.6', seconds2: '' },
      { id: '3', pointType: 'measured', distance: '4', depth: '0.6', count: '9', seconds1: '24', seconds2: '' },
      { id: '4', pointType: 'measured', distance: '6', depth: '0', count: '0', seconds1: '0', seconds2: '' },
    ]

    const summary = calculateObservationSummary(rows, settings)

    expect(summary.sections).toHaveLength(3)
    expect(summary.totalArea).toBeGreaterThan(0)
    expect(summary.totalFlow).toBeGreaterThan(0)
    expect(summary.averageVelocity).toBeGreaterThan(0)
  })

  it('不完全な観測行は計算対象から除外する', () => {
    const rows: ObservationInputRow[] = [
      { id: '1', pointType: 'measured', distance: '0', depth: '0', count: '0', seconds1: '0', seconds2: '' },
      { id: '2', pointType: 'measured', distance: '', depth: '0.8', count: '11', seconds1: '23.6', seconds2: '' },
      { id: '3', pointType: 'measured', distance: '4', depth: '0', count: '0', seconds1: '0', seconds2: '' },
    ]

    const summary = calculateObservationSummary(rows, settings)

    expect(summary.rows).toHaveLength(2)
    expect(summary.sections).toHaveLength(1)
  })

  it('水深のみ・ピア(P)の行を受け付ける', () => {
    const rows: ObservationInputRow[] = [
      { id: '1', pointType: 'measured', distance: '0', depth: '0', count: '0', seconds1: '0', seconds2: '' },
      { id: '2', pointType: 'depthOnly', distance: '1', depth: '0.5', count: '', seconds1: '', seconds2: '' },
      { id: '3', pointType: 'pier', distance: 'P', depth: '0.7', count: '', seconds1: '', seconds2: '' },
      { id: '4', pointType: 'measured', distance: '2', depth: '0', count: '0', seconds1: '0', seconds2: '' },
    ]

    const summary = calculateObservationSummary(rows, settings)

    expect(summary.rows).toHaveLength(4)
    expect(summary.rows[2].distanceLabel).toBe('P')
    expect(summary.sections.some(section => section.width === 0)).toBe(true)
  })
})