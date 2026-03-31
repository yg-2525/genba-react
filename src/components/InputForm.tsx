import { useState } from 'react'
import type { GembaData } from '../types'
import { useToast } from '../contexts/ToastContext'
import ObservationCalculator from './ObservationCalculator'
import ResponsiveDateInput from './ResponsiveDateInput'
import { fetchAverageWaterLevelBySiteDateRange, fetchWaterLevelBySiteDate } from '../utils/waterLevel'
import type { WaterLevelDetail } from '../utils/waterLevel'

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
  const [waterLevelDetail, setWaterLevelDetail] = useState<WaterLevelDetail | null>(null)
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
    setWaterLevelDetail(null)
  }

  async function handleFetchWaterLevel() {
    if (!form.name || !form.date) {
      showToast('現場名と日付を入力してから水位を取得してください', 'error')
      return
    }

    setIsFetchingWaterLevel(true)
    try {
      if (form.startTime && form.endTime) {
        const detail = await fetchAverageWaterLevelBySiteDateRange(form.name, form.date, form.startTime, form.endTime)
        setWaterLevelDetail(detail)
        setForm(prev => ({ ...prev, waterLevel: detail.average.toFixed(2) }))
        showToast('水位を取得しました（開始・終了・平均）', 'success')
      } else {
        const waterLevel = await fetchWaterLevelBySiteDate(form.name, form.date)
        setWaterLevelDetail(null)
        setForm(prev => ({ ...prev, waterLevel: waterLevel.toFixed(2) }))
        showToast('水位を取得しました', 'success')
      }
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

      {/* 基本情報 */}
      <div className="input-section">
        <div className="input-row-2col">
          <div className="floating-field">
            <input
              id="field-name"
              placeholder=" "
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <label htmlFor="field-name">現場名 *</label>
          </div>
          <ResponsiveDateInput
            label="日付 *"
            value={form.date}
            onChange={value => setForm({ ...form, date: value })}
          />
        </div>
        <div className="input-row-2col">
          <div className="floating-field">
            <input
              id="field-start"
              type="time"
              placeholder=" "
              value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })}
            />
            <label htmlFor="field-start">開始時間</label>
          </div>
          <div className="floating-field">
            <input
              id="field-end"
              type="time"
              placeholder=" "
              value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
            />
            <label htmlFor="field-end">終了時間</label>
          </div>
        </div>
      </div>

      {/* 水位セクション */}
      <div className="water-section">
        <div className="water-section-header">
          <h3>水位（m）</h3>
          <button
            type="button"
            className="btn-fetch"
            onClick={handleFetchWaterLevel}
            disabled={isFetchingWaterLevel}
          >
            {isFetchingWaterLevel ? (
              <><span className="spinner" /> 取得中...</>
            ) : (
              <><span className="fetch-icon">🌊</span> 国交省から水位取得</>
            )}
          </button>
        </div>

        <div className="water-level-grid">
          {form.startTime && form.endTime ? (
            <>
              <div className="water-level-item">
                <span className="water-level-label">開始水位</span>
                <span className="water-level-value">
                  {waterLevelDetail?.startLevel != null ? waterLevelDetail.startLevel.toFixed(2) : '--'}
                </span>
              </div>
              <div className="water-level-item">
                <span className="water-level-label">終了水位</span>
                <span className="water-level-value">
                  {waterLevelDetail?.endLevel != null ? waterLevelDetail.endLevel.toFixed(2) : '--'}
                </span>
              </div>
              <div className="water-level-item water-level-primary">
                <span className="water-level-label">平均水位</span>
                <span className="water-level-value">
                  {form.waterLevel || '--'}
                </span>
              </div>
            </>
          ) : (
            <div className="water-level-item water-level-primary water-level-single">
              <span className="water-level-label">水位</span>
              <span className="water-level-value">
                {form.waterLevel || '--'}
              </span>
            </div>
          )}
        </div>

        <div className="floating-field water-manual-input">
          <input
            id="field-wl"
            type="number"
            step="any"
            placeholder=" "
            value={form.waterLevel}
            onChange={e => { setForm({ ...form, waterLevel: e.target.value }); setWaterLevelDetail(null) }}
          />
          <label htmlFor="field-wl">水位を手入力（m）</label>
        </div>
      </div>

      <ObservationCalculator onApply={applyCalculatedValues} />

      {/* 計算結果 */}
      <div className="result-panel">
        <h3>計算結果</h3>
        <div className="result-grid">
          <div className="floating-field">
            <input
              id="field-vel"
              type="number"
              step="any"
              placeholder=" "
              value={form.velocity}
              onChange={e => setForm({ ...form, velocity: e.target.value })}
            />
            <label htmlFor="field-vel">流速（m/s）</label>
          </div>
          <div className="floating-field">
            <input
              id="field-area"
              type="number"
              step="any"
              placeholder=" "
              value={form.area}
              onChange={e => setForm({ ...form, area: e.target.value })}
            />
            <label htmlFor="field-area">断面積（㎡）</label>
          </div>
          <div className="result-card">
            <span>流量（㎥/s）</span>
            <strong>{hasCalculatedFlow ? calculatedFlow.toFixed(2) : '--'}</strong>
          </div>
        </div>
      </div>

      <button className="btn-primary" onClick={handleSubmit}>追加</button>
    </section>
  )
}
