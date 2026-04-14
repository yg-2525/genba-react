import { useState, useCallback } from 'react'
import type { GembaData } from '../types'
import useIsMobile from '../hooks/useIsMobile'
import { formatDateForDisplay } from '../utils/date'

type Props = {
  filteredList: GembaData[]
  compareFirstIndex: number | null
  onEdit: (index: number) => void
  onCompare: (index: number) => void
  onDelete: (index: number) => void
  onBulkDelete: (ids: number[]) => void
}

export default function DataList({
  filteredList,
  compareFirstIndex,
  onEdit,
  onCompare,
  onDelete,
  onBulkDelete,
}: Props) {
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const isMobile = useIsMobile()

  function handleDeleteClick(index: number) {
    setConfirmIndex(index)
  }

  const handleConfirmDelete = useCallback(() => {
    if (confirmIndex === null) return
    const item = filteredList[confirmIndex]
    if (!item) return
    setRemovingId(item.id)
    setTimeout(() => {
      onDelete(confirmIndex)
      setConfirmIndex(null)
      setRemovingId(null)
    }, 300)
  }, [confirmIndex, filteredList, onDelete])

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredList.map(d => d.id)))
    }
  }

  function handleBulkDelete() {
    onBulkDelete([...selectedIds])
    setSelectedIds(new Set())
    setBulkMode(false)
    setConfirmBulk(false)
  }

  function exitBulkMode() {
    setBulkMode(false)
    setSelectedIds(new Set())
    setConfirmBulk(false)
  }

  return (
    <section className="card">
      <div className="data-list-header">
        <h2>データ一覧</h2>
        {filteredList.length > 0 && (
          bulkMode ? (
            <div className="bulk-actions">
              <button className="btn-secondary btn-sm" onClick={toggleAll}>
                {selectedIds.size === filteredList.length ? '全解除' : '全選択'}
              </button>
              {confirmBulk ? (
                <>
                  <span className="bulk-confirm-text">{selectedIds.size}件を削除しますか？</span>
                  <button className="btn-danger btn-sm" onClick={handleBulkDelete}>削除する</button>
                  <button className="btn-secondary btn-sm" onClick={() => setConfirmBulk(false)}>キャンセル</button>
                </>
              ) : (
                <button
                  className="btn-danger btn-sm"
                  disabled={selectedIds.size === 0}
                  onClick={() => setConfirmBulk(true)}
                >
                  {selectedIds.size}件を削除
                </button>
              )}
              <button className="btn-secondary btn-sm" onClick={exitBulkMode}>戻る</button>
            </div>
          ) : (
            <button className="btn-secondary btn-sm" onClick={() => setBulkMode(true)}>選択削除</button>
          )
        )}
      </div>
      {filteredList.length === 0 ? (
        <p className="empty-message">データがありません</p>
      ) : (
        <ul className="data-list">
          {filteredList.map((data, index) => (
            <li key={data.id} className={`${compareFirstIndex === index ? 'selected' : ''}${removingId === data.id ? ' removing' : ''}`}>
              {bulkMode && (
                <label className="bulk-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(data.id)}
                    onChange={() => toggleSelect(data.id)}
                  />
                </label>
              )}
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
