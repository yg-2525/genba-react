import { useState } from 'react'
import type { GembaData } from '../types'
import { useToast } from '../contexts/ToastContext'
import ObservationCalculator from './ObservationCalculator'
import ResponsiveDateInput from './ResponsiveDateInput'

const emptyForm = {
  name: '',
  date: '',
  work: '',
  memo: '',
  waterLevel: '',
  velocity: '',
  area: '',
}

type Props = {
  onAdd: (data: GembaData) => void
}

export default function InputForm({ onAdd }: Props) {
  const [form, setForm] = useState(emptyForm)
  const { showToast } = useToast()

  function applyCalculatedValues(values: { velocity: number; area: number }) {
    setForm(prev => ({
      ...prev,
      velocity: values.velocity.toFixed(3),
      area: values.area.toFixed(2),
    }))
    showToast('計算結果を反映しました', 'success')
  }

  function handleSubmit() {
    const { name, date, work, memo, waterLevel, velocity, area } = form
    if (!name || !date || !work) {
      showToast('現場名、日付、作業内容は必須です', 'error')
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
      work,
      memo,
      waterLevel: wl,
      velocity: vel,
      area: ar,
      flow: (vel * ar).toFixed(2),
      compareNotes: '',
    })
    setForm(emptyForm)
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
        <input
          placeholder="作業内容 *"
          value={form.work}
          onChange={e => setForm({ ...form, work: e.target.value })}
        />
        <input
          placeholder="メモ"
          value={form.memo}
          onChange={e => setForm({ ...form, memo: e.target.value })}
        />
        <input
          type="number"
          placeholder="水位(m)"
          value={form.waterLevel}
          onChange={e => setForm({ ...form, waterLevel: e.target.value })}
        />
        <input
          type="number"
          placeholder="流速(m/s)"
          value={form.velocity}
          onChange={e => setForm({ ...form, velocity: e.target.value })}
        />
        <input
          type="number"
          placeholder="断面積(㎡)"
          value={form.area}
          onChange={e => setForm({ ...form, area: e.target.value })}
        />
      </div>
      <ObservationCalculator onApply={applyCalculatedValues} />
      <button className="btn-primary" onClick={handleSubmit}>追加</button>
    </section>
  )
}
