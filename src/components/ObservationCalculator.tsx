import { useMemo, useState } from 'react'
import {
  calculateObservationSummary,
  createObservationRow,
  type CalculationSettings,
  type ObservationInputRow,
} from '../utils/observation'

type Props = {
  onApply: (values: { velocity: number; area: number; flow: number }) => void
  onClearAll?: () => void
}

const defaultSettings = {
  coefficient: '',
  offset: '',
  pulseFactor: '',
}

/** 水深から器深を計算（水深を最も近い0.05刻みに丸めてから算出） */
function calcInstrumentDepth(depthStr: string): string {
  const raw = Number(depthStr)
  if (!depthStr || isNaN(raw) || raw <= 0) return '-'
  const d = Math.round(raw / 0.05) * 0.05
  // 0.48, 0.49 は丸めると 0.50 になるが、実務では6割（1点法）を使う
  const roundedUp = d >= 0.5 && raw < 0.5
  if (d >= 0.5 && !roundedUp) {
    return `${(d * 0.2).toFixed(2)}\n${(d * 0.8).toFixed(2)}`
  }
  return (d * 0.6).toFixed(2)
}

export default function ObservationCalculator({ onApply, onClearAll }: Props) {
  const [settings, setSettings] = useState(defaultSettings)
  const [rows, setRows] = useState<ObservationInputRow[]>([
    createObservationRow(),
    createObservationRow(),
    createObservationRow(),
  ])

  function resetCalculator() {
    setSettings(defaultSettings)
    setRows([createObservationRow(), createObservationRow(), createObservationRow()])
  }

  const numericSettings = useMemo<CalculationSettings>(() => ({
    coefficient: Number(settings.coefficient) || 0,
    offset: Number(settings.offset) || 0,
    pulseFactor: Number(settings.pulseFactor) || 0,
  }), [settings])

  const summary = useMemo(() => calculateObservationSummary(rows, numericSettings), [rows, numericSettings])

  function updateRow(id: string, key: keyof ObservationInputRow, value: string) {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row))
  }

  function removeRow(id: string) {
    setRows(prev => prev.length <= 2 ? prev : prev.filter(row => row.id !== id))
  }

  return (
    <div className="calculator-panel">
      <div className="calculator-header">
        <div>
          <h3>現場計算アシスト</h3>
          <p className="helper-text">
            使用する流速計の検定値を手入力して、音数と秒数から点流速を出し、測線距離と水深から区分断面積・流量を計算します。
          </p>
        </div>
      </div>

      <div className="calculator-settings">
        <div className={`floating-field${settings.coefficient ? ' filled' : ''}`}>
          <input
            id="setting-coeff"
            type="number"
            step="any"
            placeholder=" "
            value={settings.coefficient}
            onChange={event => setSettings(prev => ({ ...prev, coefficient: event.target.value }))}
          />
          <label htmlFor="setting-coeff">検定係数</label>
        </div>
        <div className={`floating-field${settings.offset ? ' filled' : ''}`}>
          <input
            id="setting-offset"
            type="number"
            step="any"
            placeholder=" "
            value={settings.offset}
            onChange={event => setSettings(prev => ({ ...prev, offset: event.target.value }))}
          />
          <label htmlFor="setting-offset">補正値</label>
        </div>
        <div className={`floating-field${settings.pulseFactor ? ' filled' : ''}`}>
          <input
            id="setting-pulse"
            type="number"
            step="any"
            placeholder=" "
            value={settings.pulseFactor}
            onChange={event => setSettings(prev => ({ ...prev, pulseFactor: event.target.value }))}
          />
          <label htmlFor="setting-pulse">音数</label>
        </div>
      </div>

      <div className="observation-grid observation-grid-header">
        <span>距離(m)</span>
        <span>水深(m)</span>
        <span>器深(m)</span>
        <span>音数</span>
        <span>秒数1</span>
        <span>秒数2</span>
        <span>操作</span>
      </div>

      {rows.map(row => (
        <div key={row.id} className="observation-grid">
          <input
            type="text"
            value={row.distance}
            placeholder="距離 / P"
            onChange={event => updateRow(row.id, 'distance', event.target.value)}
          />
          <input type="number" step="any" value={row.depth} placeholder="水深" onChange={event => updateRow(row.id, 'depth', event.target.value)} />
          <span className="instrument-depth-cell">{calcInstrumentDepth(row.depth)}</span>
          <input
            type="number"
            step="any"
            value={row.count}
            placeholder="音数"
            onChange={event => updateRow(row.id, 'count', event.target.value)}
          />
          <input
            type="number"
            step="any"
            value={row.seconds1}
            placeholder="秒数1"
            onChange={event => updateRow(row.id, 'seconds1', event.target.value)}
          />
          <input
            type="number"
            step="any"
            value={row.seconds2}
            placeholder="秒数2"
            onChange={event => updateRow(row.id, 'seconds2', event.target.value)}
          />
          <button type="button" className="btn-secondary observation-row-remove" onClick={() => removeRow(row.id)}>行削除</button>
        </div>
      ))}

      <div className="calculator-actions">
        <button type="button" className="btn-secondary" onClick={() => setRows(prev => [...prev, createObservationRow()])}>
          行を追加
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onApply({ velocity: summary.averageVelocity, area: summary.totalArea, flow: summary.totalFlow })}
          disabled={summary.sections.length === 0}
        >
          計算結果を反映
        </button>
        <button type="button" className="btn-secondary" onClick={resetCalculator}>
          計算クリア
        </button>
        {onClearAll && (
          <button type="button" className="btn-danger" onClick={() => { resetCalculator(); onClearAll() }}>
            一括クリア
          </button>
        )}
      </div>

      <div className="stats-grid calculator-summary">
        <div className="stat-item">
          <span>平均流速</span>
          <strong>{summary.averageVelocity.toFixed(2)} m/s</strong>
        </div>
        <div className="stat-item">
          <span>断面積</span>
          <strong>{summary.totalArea.toFixed(2)} ㎡</strong>
        </div>
        <div className="stat-item">
          <span>流量</span>
          <strong>{summary.totalFlow.toFixed(2)}</strong>
        </div>
        <div className="stat-item">
          <span>√Q</span>
          <strong>{(Math.round(Math.sqrt(summary.totalFlow) * 100) / 100).toFixed(2)}</strong>
        </div>
      </div>

      {summary.rows.length > 0 && (
        <div className="table-scroll">
          <table className="compare-table calc-table">
            <thead>
              <tr>
                <th>距離</th>
                <th>水深</th>
                <th>秒数平均</th>
                <th>点流速</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map(row => (
                <tr key={row.id}>
                  <td>{row.distanceLabel}</td>
                  <td>{row.depth.toFixed(2)}</td>
                  <td>{row.secondsAverage === null ? '-' : row.secondsAverage.toFixed(1)}</td>
                  <td>{row.pointVelocity === null ? '-' : row.pointVelocity.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summary.sections.length > 0 && (
        <div className="table-scroll">
          <table className="compare-table calc-table">
            <thead>
              <tr>
                <th>区分幅</th>
                <th>平均流速</th>
                <th>合計断面積</th>
                <th>区分流量</th>
              </tr>
            </thead>
            <tbody>
              {summary.sections.map(section => (
                <tr key={section.id}>
                  <td>{section.width.toFixed(2)}</td>
                  <td>{section.averageVelocity.toFixed(2)}</td>
                  <td>{section.area.toFixed(2)}</td>
                  <td>{section.flow.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}