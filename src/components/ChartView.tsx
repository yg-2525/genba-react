import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import type { GembaData } from '../types'

type Props = {
  dataList: GembaData[]
}

export default function ChartView({ dataList }: Props) {
  if (dataList.length === 0) return null

  const chartData = {
    labels: dataList.map(d => `${d.name} ${d.date}`),
    datasets: [
      {
        label: '水位(m)',
        data: dataList.map(d => d.waterLevel),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102,126,234,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: '流速(m/s)',
        data: dataList.map(d => d.velocity),
        borderColor: '#764ba2',
        backgroundColor: 'rgba(118,75,162,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: '流量',
        data: dataList.map(d => parseFloat(d.flow)),
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
      title: { display: true, text: '観測データ推移' },
    },
    scales: { y: { beginAtZero: true } },
  }

  return (
    <section className="card">
      <h2>観測データグラフ</h2>
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
    </section>
  )
}
