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
                <div><span className="item-label">現場:</span> {data.name}</div>
                <div><span className="item-label">日付:</span> {formatDateForDisplay(data.date, isMobile)}</div>
                <div><span className="item-label">作業:</span> {data.work}</div>
                <div><span className="item-label">メモ:</span> {data.memo || '-'}</div>
                <div>
                  <span className="item-label">観測値:</span>{' '}
                  水位:{data.waterLevel}m | 流速:{data.velocity}m/s | 面積:{data.area}㎡ | 流量:{data.flow}
                </div>
                {data.compareNotes && (
                  <div><span className="item-label">比較メモ:</span> {data.compareNotes}</div>
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
                <button onClick={() => onEdit(index)}>✏️ 編集</button>
                <button onClick={() => onCompare(index)}>🔄 比較</button>
                <button className="btn-danger" onClick={() => handleDeleteClick(index)}>🗑️ 削除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
