import { useMemo, useState } from 'react'
import {
  calculateObservationSummary,
  createObservationRow,
  type CalculationSettings,
  type ObservationInputRow,
} from '../utils/observation'

type Props = {
  onApply: (values: { velocity: number; area: number; flow: number }) => void
  resetRef?: React.MutableRefObject<(() => void) | null>
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


export default function ObservationCalculator({ onApply, resetRef }: Props) {
  const [settings, setSettings] = useState(defaultSettings)
  // 1行目: 水深入力、2行目: 2割/8割用
  const [mainRow, setMainRow] = useState<ObservationInputRow>(createObservationRow())
  const [subRows, setSubRows] = useState<ObservationInputRow[]>([
    { ...createObservationRow(), id: '0.2', distance: '', depth: '', count: '', seconds1: '', seconds2: '' },
    { ...createObservationRow(), id: '0.8', distance: '', depth: '', count: '', seconds1: '', seconds2: '' },
  ])

  function resetCalculator() {
    setSettings(defaultSettings)
    setMainRow(createObservationRow())
    setSubRows([
      { ...createObservationRow(), id: '0.2', distance: '', depth: '', count: '', seconds1: '', seconds2: '' },
      { ...createObservationRow(), id: '0.8', distance: '', depth: '', count: '', seconds1: '', seconds2: '' },
    ])
  }

  if (resetRef) resetRef.current = resetCalculator

  const numericSettings = useMemo<CalculationSettings>(() => ({
    coefficient: Number(settings.coefficient) || 0,
    offset: Number(settings.offset) || 0,
    pulseFactor: Number(settings.pulseFactor) || 0,
  }), [settings])

  // 水深判定
  const depthNum = Number(mainRow.depth)
  const isTwoStage = !isNaN(depthNum) && depthNum >= 0.5

  // 表示用行
  const displayRows = isTwoStage
    ? subRows.map((row, idx) => ({
        ...row,
        depth: (depthNum * (idx === 0 ? 0.2 : 0.8)).toFixed(2),
      }))
    : [{ ...mainRow, depth: (depthNum * 0.6).toFixed(2) }]

  const summary = useMemo(() => calculateObservationSummary(displayRows, numericSettings), [displayRows, numericSettings])

  // 入力ハンドラ
  function handleMainRowChange(key: keyof ObservationInputRow, value: string) {
    setMainRow(prev => ({ ...prev, [key]: value }))
  }
  function handleSubRowChange(idx: number, key: keyof ObservationInputRow, value: string) {
    setSubRows(prev => prev.map((row, i) => i === idx ? { ...row, [key]: value } : row))
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
      </div>

      {/* 入力欄 */}
      {!isTwoStage ? (
        <div className="observation-grid">
          <input
            type="text"
            value={mainRow.distance}
            placeholder="距離 / P"
            onChange={e => handleMainRowChange('distance', e.target.value)}
          />
          <input
            type="number"
            step="any"
            value={mainRow.depth}
            placeholder="水深"
            onChange={e => handleMainRowChange('depth', e.target.value)}
          />
          <span className="instrument-depth-cell">{calcInstrumentDepth(mainRow.depth)}</span>
          <input
            type="number"
            step="any"
            value={mainRow.count}
            placeholder="音数"
            onChange={e => handleMainRowChange('count', e.target.value)}
          />
          <input
            type="number"
            step="any"
            value={mainRow.seconds1}
            placeholder="秒数1"
            onChange={e => handleMainRowChange('seconds1', e.target.value)}
          />
          <input
            type="number"
            step="any"
            value={mainRow.seconds2}
            placeholder="秒数2"
            onChange={e => handleMainRowChange('seconds2', e.target.value)}
          />
        </div>
      ) : (
        <>
          {subRows.map((row, idx) => (
            <div key={row.id} className="observation-grid">
              <input
                type="text"
                value={mainRow.distance}
                placeholder="距離 / P"
                readOnly
              />
              <input
                type="number"
                step="any"
                value={mainRow.depth}
                placeholder="水深"
                readOnly
              />
              <span className="instrument-depth-cell">{idx === 0 ? '2割' : '8割'}<br />{(depthNum * (idx === 0 ? 0.2 : 0.8)).toFixed(2)}</span>
              <input
                type="number"
                step="any"
                value={row.count}
                placeholder="音数"
                onChange={e => handleSubRowChange(idx, 'count', e.target.value)}
              />
              <input
                type="number"
                step="any"
                value={row.seconds1}
                placeholder="秒数1"
                onChange={e => handleSubRowChange(idx, 'seconds1', e.target.value)}
              />
              <input
                type="number"
                step="any"
                value={row.seconds2}
                placeholder="秒数2"
                onChange={e => handleSubRowChange(idx, 'seconds2', e.target.value)}
              />
            </div>
          ))}
        </>
      )}

      <div className="calculator-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => onApply({ velocity: summary.averageVelocity, area: summary.totalArea, flow: summary.totalFlow })}
          disabled={summary.sections.length === 0}
        >
          計算結果を反映
        </button>
        <button type="button" className="btn-secondary" onClick={resetCalculator}>
          計算リセット
        </button>
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
          <strong>{summary.totalFlow.toFixed(2)} ㎥/s</strong>
        </div>
        <div className="stat-item">
          <span>√Q</span>
          <strong>{(Math.round(Math.sqrt(summary.totalFlow) * 100) / 100).toFixed(2)} ㎥/s</strong>
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