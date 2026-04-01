type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = ['00', '10', '20', '30', '40', '50']

export default function TimeSelect({ id, label, value, onChange }: Props) {
  const [h, m] = value ? value.split(':') : ['', '']

  function handleChange(nextH: string, nextM: string) {
    if (nextH && nextM) {
      onChange(`${nextH}:${nextM}`)
    } else if (!nextH && !nextM) {
      onChange('')
    }
  }

  return (
    <div className="time-select-field">
      <span className="time-select-label">{label}</span>
      <div className="time-select-row">
        <select
          id={id}
          aria-label={`${label} 時`}
          value={h}
          onChange={e => handleChange(e.target.value, m || '00')}
        >
          <option value="">時</option>
          {hours.map(hour => (
            <option key={hour} value={hour}>{hour}</option>
          ))}
        </select>
        <span className="time-select-colon">:</span>
        <select
          aria-label={`${label} 分`}
          value={m}
          onChange={e => handleChange(h || '00', e.target.value)}
        >
          <option value="">分</option>
          {minutes.map(min => (
            <option key={min} value={min}>{min}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
