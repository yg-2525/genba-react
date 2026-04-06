import { useState } from 'react'
import type { GembaData } from '../types'
import useIsMobile from '../hooks/useIsMobile'
import { formatDateForDisplay } from '../utils/date'

type Props = {
  filteredList: GembaData[]
  compareFirstIndex: number | null
  onEdit: (index: number) => void
  onCompare: (index: number) => void
  onDelete: (index: number) => void
}

export default function DataList({
  filteredList,
  compareFirstIndex,
  onEdit,
  onCompare,
  onDelete,
}: Props) {
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null)
  const isMobile = useIsMobile()

  function handleDeleteClick(index: number) {
    setConfirmIndex(index)
  }

  function handleConfirmDelete() {
    if (confirmIndex !== null) {
      onDelete(confirmIndex)
      setConfirmIndex(null)
    }
  }

  return (
    <section className="card">
      <h2>データ一覧</h2>
      {filteredList.length === 0 ? (
        <p className="empty-message">データがありません</p>
      ) : (
        <ul className="data-list">
          {filteredList.map((data, index) => (
            <li key={data.id} className={compareFirstIndex === index ? 'selected' : ''}>
              <div className="item-content">
                <div className="item-header-row">
                  <span className="item-name">{data.name}</span>
                  <span className="item-date">{formatDateForDisplay(data.date, isMobile)}</span>
                  {(data.startTime || data.endTime) && (
                    <span className="item-time">{data.startTime || '--:--'} - {data.endTime || '--:--'}</span>
                  )}
                </div>
                <div className="item-metrics">
                  <div className="item-metric">
                    <span>水位</span>
                    <strong>{data.waterLevel}m</strong>
                  </div>
                  <div className="item-metric">
                    <span>流速</span>
                    <strong>{data.velocity}m/s</strong>
                  </div>
                  <div className="item-metric">
                    <span>面積</span>
                    <strong>{data.area}㎡</strong>
                  </div>
                  <div className="item-metric">
                    <span>流量</span>
                    <strong>{data.flow} ㎥/s</strong>
                  </div>
                </div>
                {(data.work || data.memo || data.compareNotes) && (
                  <div className="item-notes">
                    {data.work && <span>作業: {data.work}</span>}
                    {data.memo && <span>メモ: {data.memo}</span>}
                    {data.compareNotes && <span>比較: {data.compareNotes}</span>}
                  </div>
                )}
                {confirmIndex === index && (
                  <div className="delete-confirm">
                    <span>本当に削除しますか？</span>
                    <button className="btn-danger" onClick={handleConfirmDelete}>削除する</button>
                    <button className="btn-secondary" onClick={() => setConfirmIndex(null)}>キャンセル</button>
                  </div>
                )}
              </div>
              <div className="item-buttons">
                <button aria-label={`${data.name}を編集`} onClick={() => onEdit(index)}>✏️ 編集</button>
                <button aria-label={`${data.name}を比較`} onClick={() => onCompare(index)}>🔄 比較</button>
                <button className="btn-danger" aria-label={`${data.name}を削除`} onClick={() => handleDeleteClick(index)}>🗑️ 削除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
