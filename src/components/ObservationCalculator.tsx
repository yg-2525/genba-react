import { useMemo, useState } from 'react'
import {
  calculateObservationSummary,
  createObservationRow,
  type CalculationSettings,
  type ObservationInputRow,
} from '../utils/observation'

type Props = {
  onApply: (values: { velocity: number; area: number }) => void
}

const defaultSettings = {
  coefficient: '',
  offset: '',
  pulseFactor: '',
}

export default function ObservationCalculator({ onApply }: Props) {
  const [settings, setSettings] = useState(defaultSettings)
  const [rows, setRows] = useState<ObservationInputRow[]>([
    createObservationRow(),
    createObservationRow(),
    createObservationRow(),
  ])

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
          <label htmlFor="setting-coeff">検定係数 a</label>
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
          <label htmlFor="setting-offset">補正値 b</label>
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
          <label htmlFor="setting-pulse">1回転あたり音数</label>
        </div>
      </div>

      <div className="observation-grid observation-grid-header">
        <span>距離(m)</span>
        <span>水深(m)</span>
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
          onClick={() => onApply({ velocity: summary.averageVelocity, area: summary.totalArea })}
          disabled={summary.sections.length === 0}
        >
          計算結果を反映
        </button>
      </div>

      <div className="stats-grid calculator-summary">
        <div className="stat-item">
          <span>平均流速</span>
          <strong>{summary.averageVelocity.toFixed(3)} m/s</strong>
        </div>
        <div className="stat-item">
          <span>断面積</span>
          <strong>{summary.totalArea.toFixed(2)} ㎡</strong>
        </div>
        <div className="stat-item">
          <span>流量</span>
          <strong>{summary.totalFlow.toFixed(2)}</strong>
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
                  <td>{row.secondsAverage === null ? '-' : row.secondsAverage.toFixed(2)}</td>
                  <td>{row.pointVelocity === null ? '-' : row.pointVelocity.toFixed(3)}</td>
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
                <th>区間</th>
                <th>区分幅</th>
                <th>平均水深</th>
                <th>平均流速</th>
                <th>区分断面積</th>
                <th>区分流量</th>
              </tr>
            </thead>
            <tbody>
              {summary.sections.map(section => (
                <tr key={section.id}>
                  <td>{section.fromDistance.toFixed(2)} - {section.toDistance.toFixed(2)}</td>
                  <td>{section.width.toFixed(2)}</td>
                  <td>{section.averageDepth.toFixed(2)}</td>
                  <td>{section.averageVelocity.toFixed(3)}</td>
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