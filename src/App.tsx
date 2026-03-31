import { useState, useEffect, useMemo } from 'react'
import type { GembaData } from './types'
import InputForm from './components/InputForm'
import SearchFilter from './components/SearchFilter'
import StatsPanel from './components/StatsPanel'
import DataList from './components/DataList'
import ChartView from './components/ChartView'
import EditModal from './components/EditModal'
import CompareModal from './components/CompareModal'
import { useToast } from './contexts/ToastContext'
import './App.css'

function App() {
  const { showToast } = useToast()
  const [dataList, setDataList] = useState<GembaData[]>(() => {
    const saved = localStorage.getItem('genbaData')
    return saved ? (JSON.parse(saved) as GembaData[]) : []
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [compareFirst, setCompareFirst] = useState<number | null>(null)
  const [compareResult, setCompareResult] = useState<{ data1: GembaData; data2: GembaData } | null>(null)
  const [searchName, setSearchName] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // localStorage 保存
  useEffect(() => {
    localStorage.setItem('genbaData', JSON.stringify(dataList))
  }, [dataList])

  // フィルター
  const filteredList = useMemo(() => {
    return dataList.filter(d => {
      const nameMatch = d.name.toLowerCase().includes(searchName.toLowerCase())
      const dateMatch =
        (!filterStartDate || d.date >= filterStartDate) &&
        (!filterEndDate || d.date <= filterEndDate)
      return nameMatch && dateMatch
    })
  }, [dataList, searchName, filterStartDate, filterEndDate])

  const editingData = dataList.find(d => d.id === editingId) ?? null

  function handleDelete(index: number) {
    const id = filteredList[index].id
    setDataList(prev => prev.filter(d => d.id !== id))
  }

  function handleCompare(index: number) {
    if (compareFirst === null) {
      setCompareFirst(index)
      showToast(`「${filteredList[index].name}」を選択しました。比較対象をもう一つ選択してください。`, 'info')
    } else {
      setCompareResult({ data1: filteredList[compareFirst], data2: filteredList[index] })
      setCompareFirst(null)
    }
  }

  function handleSaveCompareNotes(notes: string) {
    if (compareResult) {
      setDataList(prev =>
        prev.map(d => d.id === compareResult.data1.id ? { ...d, compareNotes: notes } : d)
      )
      showToast('メモを保存しました', 'success')
      setCompareResult(null)
    }
  }

  function exportCSV() {
    if (dataList.length === 0) {
      showToast('エクスポートするデータがありません', 'error')
      return
    }
    let csv = '現場名,日付,開始時間,終了時間,作業内容,メモ,水位(m),流速(m/s),断面積(㎡),流量,比較メモ\n'
    dataList.forEach(d => {
      csv += `"${d.name}",${d.date},${d.startTime ?? ''},${d.endTime ?? ''},"${d.work}","${d.memo}",${d.waterLevel},${d.velocity},${d.area},${d.flow},"${d.compareNotes}"\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `genba_log_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <h1>現場ログ管理</h1>

      <InputForm onAdd={data => setDataList(prev => [...prev, data])} />

      <SearchFilter
        searchName={searchName}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onSearchName={setSearchName}
        onStartDate={setFilterStartDate}
        onEndDate={setFilterEndDate}
        onReset={() => { setSearchName(''); setFilterStartDate(''); setFilterEndDate('') }}
      />

      <StatsPanel dataList={dataList} onExportCSV={exportCSV} />

      <DataList
        filteredList={filteredList}
        compareFirstIndex={compareFirst}
        onEdit={index => setEditingId(filteredList[index].id)}
        onCompare={handleCompare}
        onDelete={handleDelete}
      />

      <ChartView dataList={dataList} />

      {editingId !== null && editingData && (
        <EditModal
          data={editingData}
          onSave={updated => {
            setDataList(prev => prev.map(d => d.id === editingId ? { ...d, ...updated } : d))
            setEditingId(null)
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {compareResult && (
        <CompareModal
          data1={compareResult.data1}
          data2={compareResult.data2}
          onSaveNotes={handleSaveCompareNotes}
          onClose={() => setCompareResult(null)}
        />
      )}
    </div>
  )
}

export default App
