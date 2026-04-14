import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import type { GembaData } from '../types'

type Props = {
  dataList: GembaData[]
}

export default function ChartView({ dataList }: Props) {
  const [selectedSite, setSelectedSite] = useState('')

  const siteNames = useMemo(() => {
    const names = [...new Set(dataList.map(d => d.name))]
    names.sort()
    return names
  }, [dataList])

  const filtered = useMemo(() => {
    if (!selectedSite) return dataList
    return dataList.filter(d => d.name === selectedSite)
  }, [dataList, selectedSite])

  if (dataList.length === 0) return null

  const chartData = {
    labels: filtered.map(d => selectedSite ? d.date : `${d.name} ${d.date}`),
    datasets: [
      {
        label: '水位(m)',
        data: filtered.map(d => d.waterLevel),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102,126,234,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: '流速(m/s)',
        data: filtered.map(d => d.velocity),
        borderColor: '#764ba2',
        backgroundColor: 'rgba(118,75,162,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: '流量(㎥/s)',
        data: filtered.map(d => parseFloat(d.flow)),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40,167,69,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: selectedSite ? `${selectedSite} 観測データ推移` : '観測データ推移' },
    },
    scales: { y: { beginAtZero: true } },
  }

  return (
    <section className="card">
      <h2>観測データグラフ</h2>
      {siteNames.length > 1 && (
        <select
          value={selectedSite}
          onChange={e => setSelectedSite(e.target.value)}
          style={{ marginBottom: 12 }}
        >
          <option value="">全地点</option>
          {siteNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      )}
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
    </section>
  )
}
