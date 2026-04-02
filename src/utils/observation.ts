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

/** 流速専用: 小数第2位で四捨五入（4以下切り捨て、5以上切り上げ） */
function roundVelocity(value: number) {
  return Math.round(value * 100) / 100
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

  return roundVelocity((((count * settings.pulseFactor) / secondsAverage) * settings.coefficient) + settings.offset)
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

  // Build sub-sections with area only
  const subSections: Array<{
    fromIdx: number
    toIdx: number
    fromDistance: number
    toDistance: number
    width: number
    averageDepth: number
    area: number
  }> = []

  for (let i = 0; i < rows.length - 1; i++) {
    const current = rows[i]
    const next = rows[i + 1]
    const width = round(next.distance - current.distance, 2)
    if (width < 0) continue
    const averageDepth = round((current.depth + next.depth) / 2, 2)
    const area = round(width * averageDepth, 2)
    subSections.push({
      fromIdx: i, toIdx: i + 1,
      fromDistance: current.distance, toDistance: next.distance,
      width, averageDepth, area,
    })
  }

  // Classify sub-sections and group around measured rows
  const sections: SectionSummary[] = []
  const measuredGroups = new Map<number, typeof subSections>()

  for (const sub of subSections) {
    const fromType = rows[sub.fromIdx].pointType
    const toType = rows[sub.toIdx].pointType

    if (fromType === 'measured' && toType === 'measured') {
      const v1 = rows[sub.fromIdx].pointVelocity ?? 0
      const v2 = rows[sub.toIdx].pointVelocity ?? 0
      const avgVel = roundVelocity((v1 + v2) / 2)
      sections.push({
        id: rows[sub.fromIdx].id,
        fromDistance: sub.fromDistance,
        toDistance: sub.toDistance,
        width: sub.width,
        averageDepth: sub.averageDepth,
        averageVelocity: avgVel,
        area: sub.area,
        flow: round(sub.area * avgVel, 2),
      })
    } else if (fromType === 'measured') {
      const key = sub.fromIdx
      if (!measuredGroups.has(key)) measuredGroups.set(key, [])
      measuredGroups.get(key)!.push(sub)
    } else if (toType === 'measured') {
      const key = sub.toIdx
      if (!measuredGroups.has(key)) measuredGroups.set(key, [])
      measuredGroups.get(key)!.push(sub)
    } else {
      sections.push({
        id: rows[sub.fromIdx].id,
        fromDistance: sub.fromDistance,
        toDistance: sub.toDistance,
        width: sub.width,
        averageDepth: sub.averageDepth,
        averageVelocity: 0,
        area: sub.area,
        flow: 0,
      })
    }
  }

  // Build merged sections from measured groups
  for (const [mIdx, subs] of measuredGroups) {
    const measured = rows[mIdx]
    const sorted = [...subs].sort((a, b) => a.fromDistance - b.fromDistance)
    const fromDist = sorted[0].fromDistance
    const toDist = sorted[sorted.length - 1].toDistance
    const totalWidth = round(toDist - fromDist, 2)
    const totalArea = round(sorted.reduce((sum, s) => sum + s.area, 0), 2)
    const velocity = measured.pointVelocity ?? 0
    const avgDepth = totalWidth > 0 ? round(totalArea / totalWidth, 2) : 0

    sections.push({
      id: measured.id,
      fromDistance: fromDist,
      toDistance: toDist,
      width: totalWidth,
      averageDepth: avgDepth,
      averageVelocity: velocity,
      area: totalArea,
      flow: round(totalArea * velocity, 2),
    })
  }

  sections.sort((a, b) => a.fromDistance - b.fromDistance)

  const totalArea = round(sections.reduce((sum, section) => sum + section.area, 0), 2)
  const totalFlow = round(sections.reduce((sum, section) => sum + section.flow, 0), 2)
  const averageVelocity = totalArea === 0 ? 0 : roundVelocity(totalFlow / totalArea)

  return {
    rows,
    sections,
    totalArea,
    totalFlow,
    averageVelocity,
  }
}