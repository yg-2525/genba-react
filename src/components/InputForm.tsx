import { useState } from 'react'
import type { GembaData } from '../types'
import { useToast } from '../contexts/ToastContext'
import ObservationCalculator from './ObservationCalculator'
import ResponsiveDateInput from './ResponsiveDateInput'
import { fetchAverageWaterLevelBySiteDateRange, fetchWaterLevelBySiteDate } from '../utils/waterLevel'

const emptyForm = {
  name: '',
  date: '',
  startTime: '',
  endTime: '',
  waterLevel: '',
  velocity: '',
  area: '',
}

type Props = {
  onAdd: (data: GembaData) => void
}

export default function InputForm({ onAdd }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [isFetchingWaterLevel, setIsFetchingWaterLevel] = useState(false)
  const { showToast } = useToast()
  const calculatedFlow = Number(form.velocity) * Number(form.area)
  const hasCalculatedFlow = !Number.isNaN(calculatedFlow) && Number.isFinite(calculatedFlow)

  function applyCalculatedValues(values: { velocity: number; area: number }) {
    setForm(prev => ({
      ...prev,
      velocity: values.velocity.toFixed(3),
      area: values.area.toFixed(2),
    }))
    showToast('計算結果を反映しました', 'success')
  }

  function handleSubmit() {
    const { name, date, startTime, endTime, waterLevel, velocity, area } = form
    if (!name || !date) {
      showToast('現場名と日付は必須です', 'error')
      return
    }
    const wl = Number(waterLevel)
    const vel = Number(velocity)
    const ar = Number(area)
    if (isNaN(wl) || isNaN(vel) || isNaN(ar)) {
      showToast('観測データは数値で入力してください', 'error')
      return
    }
    onAdd({
      id: Date.now(),
      name,
      date,
      startTime,
      endTime,
      work: '',
      memo: '',
      waterLevel: wl,
      velocity: vel,
      area: ar,
      flow: (vel * ar).toFixed(2),
      compareNotes: '',
    })
    setForm(emptyForm)
  }

  async function handleFetchWaterLevel() {
    if (!form.name || !form.date) {
      showToast('現場名と日時を入力してから水位を取得してください', 'error')
      return
    }

    setIsFetchingWaterLevel(true)
    try {
      const waterLevel = form.startTime && form.endTime
        ? await fetchAverageWaterLevelBySiteDateRange(form.name, form.date, form.startTime, form.endTime)
        : await fetchWaterLevelBySiteDate(form.name, form.date)
      setForm(prev => ({ ...prev, waterLevel: waterLevel.toFixed(2) }))
      showToast(form.startTime && form.endTime ? '時間平均水位を取得しました' : '水位を取得しました', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : '水位の取得に失敗しました'
      showToast(message, 'error')
    } finally {
      setIsFetchingWaterLevel(false)
    }
  }

  return (
    <section className="card">
      <h2>新規データ入力</h2>
      <div className="form-grid">
        <input
          placeholder="現場名 *"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <ResponsiveDateInput
          label="日付"
          value={form.date}
          onChange={value => setForm({ ...form, date: value })}
        />
        <label>
          開始時間
          <input
            type="time"
            value={form.startTime}
            onChange={e => setForm({ ...form, startTime: e.target.value })}
          />
        </label>
        <label>
          終了時間
          <input
            type="time"
            value={form.endTime}
            onChange={e => setForm({ ...form, endTime: e.target.value })}
          />
        </label>
        <input
          type="number"
          placeholder="水位(m)"
          value={form.waterLevel}
          onChange={e => setForm({ ...form, waterLevel: e.target.value })}
        />
        <button
          type="button"
          className="btn-secondary water-level-fetch"
          onClick={handleFetchWaterLevel}
          disabled={isFetchingWaterLevel}
        >
          {isFetchingWaterLevel ? '水位取得中...' : '国交省サイトから水位取得(時間平均対応)'}
        </button>
      </div>
      <ObservationCalculator onApply={applyCalculatedValues} />
      <div className="result-panel">
        <h3>計算結果</h3>
        <div className="result-grid">
          <label>
            流速(m/s)
            <input
              type="number"
              step="any"
              placeholder="流速(m/s)"
              value={form.velocity}
              onChange={e => setForm({ ...form, velocity: e.target.value })}
            />
          </label>
          <label>
            断面積(㎡)
            <input
              type="number"
              step="any"
              placeholder="断面積(㎡)"
              value={form.area}
              onChange={e => setForm({ ...form, area: e.target.value })}
            />
          </label>
          <div className="result-card">
            <span>流量</span>
            <strong>{hasCalculatedFlow ? calculatedFlow.toFixed(2) : '--'}</strong>
          </div>
        </div>
      </div>
      <button className="btn-primary" onClick={handleSubmit}>追加</button>
    </section>
  )
}
