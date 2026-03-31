import useIsMobile from '../hooks/useIsMobile'
import { buildIsoDate, formatDateForDisplay, getDaysInMonth, splitIsoDate } from '../utils/date'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
}

export default function ResponsiveDateInput({ label, value, onChange }: Props) {
  const isMobile = useIsMobile()
  const { year, month, day } = splitIsoDate(value)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, index) => String(currentYear - 10 + index))
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, index) => String(index + 1).padStart(2, '0'))

  function handlePartChange(nextYear: string, nextMonth: string, nextDay: string) {
    onChange(buildIsoDate(nextYear, nextMonth, nextDay))
  }

  if (!isMobile) {
    return (
      <label className="date-field">
        {label && <span className="date-field-label">{label}</span>}
        <input
          type="date"
          aria-label={label || '日付'}
          value={value}
          onChange={event => onChange(event.target.value)}
        />
      </label>
    )
  }

  return (
    <div className="date-field">
      {label && <span className="date-field-label">{label}</span>}
      <div className="date-selects">
        <select
          aria-label={`${label || '日付'} 年`}
          value={year}
          onChange={event => handlePartChange(event.target.value, month, day)}
        >
          <option value="">年</option>
          {years.map(optionYear => (
            <option key={optionYear} value={optionYear}>{optionYear}</option>
          ))}
        </select>
        <select
          aria-label={`${label || '日付'} 月`}
          value={month}
          onChange={event => handlePartChange(year, event.target.value, day)}
        >
          <option value="">月</option>
          {months.map(optionMonth => (
            <option key={optionMonth} value={optionMonth}>{optionMonth}</option>
          ))}
        </select>
        <select
          aria-label={`${label || '日付'} 日`}
          value={day}
          onChange={event => handlePartChange(year, month, event.target.value)}
        >
          <option value="">日</option>
          {days.map(optionDay => (
            <option key={optionDay} value={optionDay}>{optionDay}</option>
          ))}
        </select>
      </div>
      {value && <span className="date-preview">{formatDateForDisplay(value, false)}</span>}
    </div>
  )
}