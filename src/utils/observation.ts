export type ObservationPointType = 'measured' | 'depthOnly' | 'pier'

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
  pointType: ObservationPointType
  distanceLabel: string
  isPier: boolean
  distance: number
  depth: number
  count: number | null
  secondsAverage: number | null
  pointVelocity: number | null
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
  return Math.ceil(value * factor) / factor
}

function parseNumber(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseDistance(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return { distance: null, isPier: false, distanceLabel: '' }
  }
  if (normalized === 'p') {
    return { distance: null, isPier: true, distanceLabel: 'P' }
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    return { distance: null, isPier: false, distanceLabel: '' }
  }

  return { distance: parsed, isPier: false, distanceLabel: parsed.toFixed(1) }
}

function calcSecondsAverage(seconds1: number | null, seconds2: number | null) {
  const values = [seconds1, seconds2].filter((value): value is number => value !== null)
  if (values.length === 0) {
    return null
  }
  return round(values.reduce((sum, value) => sum + value, 0) / values.length, 1)
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

function inferPointType(row: ObservationInputRow): ObservationPointType {
  const dist = row.distance.trim().toLowerCase()
  if (dist === 'p') return 'pier'
  const hasCount = row.count.trim() !== ''
  const hasSeconds = row.seconds1.trim() !== '' || row.seconds2.trim() !== ''
  if (!hasCount && !hasSeconds) return 'depthOnly'
  return 'measured'
}

function resolveRowVelocity(rows: ObservationComputedRow[], targetIndex: number) {
  const target = rows[targetIndex]
  if (target.pointVelocity !== null) {
    return target.pointVelocity
  }

  let prevIndex: number | null = null
  for (let index = targetIndex - 1; index >= 0; index -= 1) {
    if (rows[index].pointVelocity !== null) {
      prevIndex = index
      break
    }
  }

  let nextIndex: number | null = null
  for (let index = targetIndex + 1; index < rows.length; index += 1) {
    if (rows[index].pointVelocity !== null) {
      nextIndex = index
      break
    }
  }

  if (prevIndex !== null && nextIndex !== null) {
    const prev = rows[prevIndex]
    const next = rows[nextIndex]
    if (next.distance === prev.distance) {
      return prev.pointVelocity ?? 0
    }

    const ratio = (target.distance - prev.distance) / (next.distance - prev.distance)
    const estimated = (prev.pointVelocity ?? 0) + ((next.pointVelocity ?? 0) - (prev.pointVelocity ?? 0)) * ratio
    return round(estimated, 3)
  }

  if (prevIndex !== null) {
    return rows[prevIndex].pointVelocity ?? 0
  }

  if (nextIndex !== null) {
    return rows[nextIndex].pointVelocity ?? 0
  }

  return 0
}

export function calculateObservationSummary(
  inputRows: ObservationInputRow[],
  settings: CalculationSettings,
): ObservationSummary {
  let lastDistance = 0
  const rows: ObservationComputedRow[] = []

  inputRows.forEach(row => {
    const parsedDistance = parseDistance(row.distance)
    const depth = parseNumber(row.depth)

    if (depth === null) {
      return
    }

    const normalizedDistance = parsedDistance.distance ?? (parsedDistance.isPier ? lastDistance : null)
    if (normalizedDistance === null) {
      return
    }

    lastDistance = normalizedDistance

    const pointType = inferPointType(row)

    if (pointType !== 'measured') {
      rows.push({
        id: row.id,
        pointType,
        distanceLabel: pointType === 'pier' ? 'P' : normalizedDistance.toFixed(1),
        isPier: pointType === 'pier',
        distance: normalizedDistance,
        depth,
        count: null,
        secondsAverage: null,
        pointVelocity: null,
      })
      return
    }

    const count = parseNumber(row.count)
    const secondsAverage = calcSecondsAverage(parseNumber(row.seconds1), parseNumber(row.seconds2))
    if (count === null || secondsAverage === null) {
      return
    }

    rows.push({
      id: row.id,
      pointType: 'measured',
      distanceLabel: normalizedDistance.toFixed(1),
      isPier: false,
      distance: normalizedDistance,
      depth,
      count,
      secondsAverage,
      pointVelocity: calcPointVelocity(count, secondsAverage, settings),
    })
  })

  const sections = rows.slice(0, -1).map((current, index) => {
    const next = rows[index + 1]
    const width = round(next.distance - current.distance, 2)
    const averageDepth = round((current.depth + next.depth) / 2, 2)
    const currentVelocity = resolveRowVelocity(rows, index)
    const nextVelocity = resolveRowVelocity(rows, index + 1)
    const averageVelocity = round((currentVelocity + nextVelocity) / 2, 3)
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