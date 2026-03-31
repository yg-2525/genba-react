import ResponsiveDateInput from './ResponsiveDateInput'

type Props = {
  searchName: string
  filterStartDate: string
  filterEndDate: string
  onSearchName: (v: string) => void
  onStartDate: (v: string) => void
  onEndDate: (v: string) => void
  onReset: () => void
}

export default function SearchFilter({
  searchName,
  filterStartDate,
  filterEndDate,
  onSearchName,
  onStartDate,
  onEndDate,
  onReset,
}: Props) {
  return (
    <section className="card">
      <h2>検索・フィルター</h2>
      <div className="form-grid">
        <input
          placeholder="現場名で検索"
          value={searchName}
          onChange={e => onSearchName(e.target.value)}
        />
        <ResponsiveDateInput
          label="開始日"
          value={filterStartDate}
          onChange={onStartDate}
        />
        <ResponsiveDateInput
          label="終了日"
          value={filterEndDate}
          onChange={onEndDate}
        />
      </div>
      <button className="btn-secondary" onClick={onReset}>リセット</button>
    </section>
  )
}
