import { useState } from 'react'
import type { GembaData } from '../types'
import { useToast } from '../contexts/ToastContext'

type Props = {
  data1: GembaData
  data2: GembaData
  onSaveNotes: (notes: string) => void
  onClose: () => void
}

export default function CompareModal({ data1, data2, onSaveNotes, onClose }: Props) {
  const [notes, setNotes] = useState('')
  const { showToast } = useToast()

  function handleSave() {
    if (!notes.trim()) {
      showToast('メモを入力してください', 'error')
      return
    }
    onSaveNotes(notes)
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="compare-modal-title" onClick={e => e.stopPropagation()}>
        <h2 id="compare-modal-title">比較結果</h2>
        <table className="compare-table">
          <thead>
            <tr>
              <th>項目</th>
              <th>{data1.name}</th>
              <th>{data2.name}</th>
              <th>差</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>水位(m)</td>
              <td>{data1.waterLevel}</td>
              <td>{data2.waterLevel}</td>
              <td>{(data2.waterLevel - data1.waterLevel).toFixed(2)}</td>
            </tr>
            <tr>
              <td>流速(m/s)</td>
              <td>{data1.velocity}</td>
              <td>{data2.velocity}</td>
              <td>{(data2.velocity - data1.velocity).toFixed(2)}</td>
            </tr>
            <tr>
              <td>断面積(㎡)</td>
              <td>{data1.area}</td>
              <td>{data2.area}</td>
              <td>{(data2.area - data1.area).toFixed(2)}</td>
            </tr>
            <tr>
              <td>流量</td>
              <td>{data1.flow}</td>
              <td>{data2.flow}</td>
              <td>{(parseFloat(data2.flow) - parseFloat(data1.flow)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <textarea
          placeholder="比較メモを入力..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
        <div className="modal-buttons">
          <button className="btn-primary" onClick={handleSave}>メモを保存</button>
          <button className="btn-secondary" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  )
}
