import { useState } from 'react'
import type { GembaData } from '../types'
import { useToast } from '../contexts/ToastContext'
import ObservationCalculator from './ObservationCalculator'
import ResponsiveDateInput from './ResponsiveDateInput'

type FormState = {
  name: string
  date: string
  work: string
  memo: string
  waterLevel: string
  velocity: string
  area: string
}

type Props = {
  data: GembaData
  onSave: (updated: Partial<GembaData>) => void
  onCancel: () => void
}

export default function EditModal({ data, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    name: data.name,
    date: data.date,
    work: data.work,
    memo: data.memo,
    waterLevel: String(data.waterLevel),
    velocity: String(data.velocity),
    area: String(data.area),
  })
  const { showToast } = useToast()

  function applyCalculatedValues(values: { velocity: number; area: number }) {
    setForm(prev => ({
      ...prev,
      velocity: values.velocity.toFixed(3),
      area: values.area.toFixed(2),
    }))
    showToast('計算結果を反映しました', 'success')
  }

  function handleSave() {
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
    onSave({
      name,
      date,
      work,
      memo,
      waterLevel: wl,
      velocity: vel,
      area: ar,
      flow: (vel * ar).toFixed(2),
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>データ編集</h2>
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
        <div className="modal-buttons">
          <button className="btn-primary" onClick={handleSave}>保存</button>
          <button className="btn-secondary" onClick={onCancel}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
