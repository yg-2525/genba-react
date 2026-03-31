export type ObservationInputRow = {
  id: string
  distance: string
  depth: string
  count: string
  seconds1: string
  seconds2: string
}

export type CalculationSettings = {
  coefficient: number
  offset: number
  pulseFactor: number
}

export type ObservationComputedRow = {
  id: string
  distance: number
  depth: number
  count: number
  secondsAverage: number
  pointVelocity: number
}

export type SectionSummary = {
  id: string
  fromDistance: number
  toDistance: number
  width: number
  averageDepth: number
  averageVelocity: number
  area: number
  flow: number
}

export type ObservationSummary = {
  rows: ObservationComputedRow[]
  sections: SectionSummary[]
  totalArea: number
  totalFlow: number
  averageVelocity: number
}

function round(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function parseNumber(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function calcSecondsAverage(seconds1: number | null, seconds2: number | null) {
  const values = [seconds1, seconds2].filter((value): value is number => value !== null)
  if (values.length === 0) {
    return null
  }
  return round(values.reduce((sum, value) => sum + value, 0) / values.length, 2)
}

export function calcPointVelocity(count: number, secondsAverage: number, settings: CalculationSettings) {
  if (count === 0 || secondsAverage === 0) {
    return 0
  }

  return round((((count * settings.pulseFactor) / secondsAverage) * settings.coefficient) + settings.offset, 3)
}

export function createObservationRow(): ObservationInputRow {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    distance: '',
    depth: '',
    count: '',
    seconds1: '',
    seconds2: '',
  }
}

export function calculateObservationSummary(
  inputRows: ObservationInputRow[],
  settings: CalculationSettings,
): ObservationSummary {
  const rows = inputRows.flatMap(row => {
    const distance = parseNumber(row.distance)
    const depth = parseNumber(row.depth)
    const count = parseNumber(row.count)
    const secondsAverage = calcSecondsAverage(parseNumber(row.seconds1), parseNumber(row.seconds2))

    if (distance === null || depth === null || count === null || secondsAverage === null) {
      return []
    }

    return [{
      id: row.id,
      distance,
      depth,
      count,
      secondsAverage,
      pointVelocity: calcPointVelocity(count, secondsAverage, settings),
    }]
  })

  const sections = rows.slice(0, -1).map((current, index) => {
    const next = rows[index + 1]
    const width = round(next.distance - current.distance, 2)
    const averageDepth = round((current.depth + next.depth) / 2, 2)
    const averageVelocity = current.pointVelocity === 0
      ? next.pointVelocity
      : round((current.pointVelocity + next.pointVelocity) / 2, 3)
    const area = round(width * averageDepth, 2)
    const flow = round(area * averageVelocity, 2)

    return {
      id: current.id,
      fromDistance: current.distance,
      toDistance: next.distance,
      width,
      averageDepth,
      averageVelocity,
      area,
      flow,
    }
  }).filter(section => section.width >= 0)

  const totalArea = round(sections.reduce((sum, section) => sum + section.area, 0), 2)
  const totalFlow = round(sections.reduce((sum, section) => sum + section.flow, 0), 2)
  const averageVelocity = totalArea === 0 ? 0 : round(totalFlow / totalArea, 3)

  return {
    rows,
    sections,
    totalArea,
    totalFlow,
    averageVelocity,
  }
}