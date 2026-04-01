import { useState } from 'react'
import type { GembaData } from '../types'
import { useToast } from '../contexts/ToastContext'
import ObservationCalculator from './ObservationCalculator'
import ResponsiveDateInput from './ResponsiveDateInput'

type FormState = {
  name: string
  date: string
  startTime: string
  endTime: string
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
    startTime: data.startTime ?? '',
    endTime: data.endTime ?? '',
    waterLevel: String(data.waterLevel),
    velocity: String(data.velocity),
    area: String(data.area),
  })
  const { showToast } = useToast()
  const calculatedFlow = Number(form.velocity) * Number(form.area)
  const hasCalculatedFlow = !Number.isNaN(calculatedFlow) && Number.isFinite(calculatedFlow)

  function applyCalculatedValues(values: { velocity: number; area: number }) {
    setForm(prev => ({
      ...prev,
      velocity: values.velocity.toFixed(2),
      area: values.area.toFixed(2),
    }))
    showToast('計算結果を反映しました', 'success')
  }

  function handleSave() {
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
    onSave({
      name,
      date,
      startTime,
      endTime,
      work: data.work,
      memo: data.memo,
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
        <div className="modal-buttons">
          <button className="btn-primary" onClick={handleSave}>保存</button>
          <button className="btn-secondary" onClick={onCancel}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
