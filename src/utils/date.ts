export function splitIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { year: '', month: '', day: '' }
  }

  const [year, month, day] = value.split('-')
  return { year, month, day }
}

export function buildIsoDate(year: string, month: string, day: string) {
  if (!year || !month || !day) {
    return ''
  }

  const yearNumber = Number(year)
  const monthNumber = Number(month)
  const dayNumber = Number(day)

  if (Number.isNaN(yearNumber) || Number.isNaN(monthNumber) || Number.isNaN(dayNumber)) {
    return ''
  }

  const lastDay = new Date(yearNumber, monthNumber, 0).getDate()
  if (dayNumber > lastDay) {
    return ''
  }

  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-')
}

export function getDaysInMonth(year: string, month: string) {
  if (!year || !month) {
    return 31
  }

  return new Date(Number(year), Number(month), 0).getDate()
}

export function formatDateForDisplay(value: string, isMobile: boolean) {
  if (!value) {
    return ''
  }

  const { year, month, day } = splitIsoDate(value)
  if (!year || !month || !day) {
    return value
  }

  if (isMobile) {
    return `${year.slice(2)}/${month}/${day}`
  }

  return `${year}/${month}/${day}`
}