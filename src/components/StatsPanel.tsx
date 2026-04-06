import { useMemo, useState } from 'react'
import type { GembaData } from '../types'

type Props = {
  dataList: GembaData[]
  onExportCSV: (siteName?: string) => void
}

export default function StatsPanel({ dataList, onExportCSV }: Props) {
  const [csvSite, setCsvSite] = useState('')

  const siteNames = useMemo(() => {
    const names = [...new Set(dataList.map(d => d.name))]
    names.sort()
    return names
  }, [dataList])

  if (dataList.length === 0) return null

  const avg = (arr: number[]) =>
    arr.reduce((s, x) => s + x, 0) / arr.length

  const avgWaterLevel = avg(dataList.map(d => d.waterLevel)).toFixed(2)
  const avgVelocity = avg(dataList.map(d => d.velocity)).toFixed(2)
  const avgFlow = avg(dataList.map(d => parseFloat(d.flow))).toFixed(2)

  return (
    <section className="card">
      <h2>統計情報</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span>件数</span>
          <strong>{dataList.length}</strong>
        </div>
        <div className="stat-item">
          <span>平均水位</span>
          <strong>{avgWaterLevel} m</strong>
        </div>
        <div className="stat-item">
          <span>平均流速</span>
          <strong>{avgVelocity} m/s</strong>
        </div>
        <div className="stat-item">
          <span>平均流量</span>
          <strong>{avgFlow}</strong>
        </div>
      </div>
      <div className="csv-export-row">
        {siteNames.length > 1 && (
          <select value={csvSite} onChange={e => setCsvSite(e.target.value)}>
            <option value="">全地点</option>
            {siteNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
        <button className="btn-secondary" onClick={() => onExportCSV(csvSite || undefined)}>
          CSV エクスポート
        </button>
      </div>
    </section>
  )
}
