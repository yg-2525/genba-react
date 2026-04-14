/* ===== 水位キャッシュ (sessionStorage) ===== */
const CACHE_PREFIX = 'wl_cache:'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10分

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { value, expires } = JSON.parse(raw) as { value: T; expires: number }
    if (Date.now() > expires) {
      sessionStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return value
  } catch {
    return null
  }
}

function setCache<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ value, expires: Date.now() + CACHE_TTL_MS }),
    )
  } catch {
    // sessionStorage full — ignore
  }
}

type WaterLevelApiResponse = {
  waterLevel: number | string
}

export type WaterLevelDetail = {
  startLevel: number | null
  endLevel: number | null
  average: number
}

type RiverSearchItem = {
  ofcCd: string | number
  itmkndCd: string | number
  obsCd: string | number
  obsNm: string
  rsysNm: string
  rvrNm: string
  adr: string
}

type RiverSearchResponse = {
  result?: {
    list?: RiverSearchItem[]
    count?: number
  }
}

type RiverLevelResponse = {
  dspFlg?: number
  obsValue?: {
    stg?: number | string | null
    stgCcd?: number
  }
}

/** 閉局・欠測を表す文字列パターン */
const CLOSED_PATTERNS = ['閉局', '欠測', '--']





/**
 * stg 値を水位としてパース。
 * - 数値 → そのまま返す
 * - 「閉局」「欠測」等 → その文字列を返す（UI 表示用）
 * - null / undefined / 空文字 → null を返す
 * Number(null)=0, Number('')=0 の JS 罠を回避する。
 */
function parseStgValue(stg: number | string | null | undefined): number | string | null {
  if (stg === null || stg === undefined) return null
  if (typeof stg === 'string') {
    const trimmed = stg.trim()
    if (!trimmed || trimmed === '-') return null
    // 閉局・欠測等の状態文字列はそのまま返す
    if (CLOSED_PATTERNS.some(p => trimmed.includes(p))) return trimmed
    const value = Number(trimmed)
    return Number.isFinite(value) ? value : null
  }
  return Number.isFinite(stg) ? stg : null
}

const WATER_LEVEL_SOURCE_URL = (() => {
  const envUrl = (import.meta.env.VITE_WATER_LEVEL_SOURCE_URL ?? '').trim()
  if (envUrl) return envUrl
  // 開発環境では Vite プロキシ（/river-api → river.go.jp）を使用
  if (import.meta.env.DEV) return '/river-api'
  // 本番では直接アクセス（CORS で失敗する場合は VITE_WATER_LEVEL_SOURCE_URL に
  // Cloudflare Worker 等のプロキシ URL を設定する）
  return 'https://www.river.go.jp'
})()
const WATER_LEVEL_API_URL = (import.meta.env.VITE_WATER_LEVEL_API_URL ?? '').trim()
const USE_DIRECT_RIVER_API = (import.meta.env.VITE_WATER_LEVEL_USE_DIRECT ?? 'true').toLowerCase() === 'true'

function pad(value: string | number, length: number) {
  return String(value).padStart(length, '0')
}

function buildObsFcd(item: RiverSearchItem) {
  return `${pad(item.ofcCd, 5)}${pad(item.itmkndCd, 3)}${pad(item.obsCd, 5)}`
}

function getDateKey(dateTime: string) {
  const datePart = dateTime.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart.replace(/-/g, '')
  }
  return null
}

function getPrimaryTimeKey(dateTime: string) {
  const match = dateTime.match(/T?(\d{2}):(\d{2})/)
  if (match) {
    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const roundedMinutes = Math.floor(minutes / 10) * 10
      return `${String(hours).padStart(2, '0')}${String(roundedMinutes).padStart(2, '0')}`
    }
  }

  const now = new Date()
  const roundedMinutes = Math.floor(now.getMinutes() / 10) * 10
  return `${String(now.getHours()).padStart(2, '0')}${String(roundedMinutes).padStart(2, '0')}`
}

function buildCandidateTimeKeys(primaryKey: string) {
  const primaryHours = Number(primaryKey.slice(0, 2))
  const primaryMinutes = Number(primaryKey.slice(2, 4))
  const base = (primaryHours * 60) + primaryMinutes
  const offsets = [0, -10, -20, -30, -40, -50, -60, -90, -120, 10, 20, 30]
  const candidateSet = new Set<string>()

  offsets.forEach(offset => {
    const total = base + offset
    if (total < 0 || total > (23 * 60) + 50) {
      return
    }

    const hour = Math.floor(total / 60)
    const minute = total % 60
    if (minute % 10 !== 0) {
      return
    }
    candidateSet.add(`${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`)
  })

  // 時刻未指定のときも当たりやすい代表時刻を追加
  ;['1300', '1200', '0900', '1500', '0000'].forEach(key => candidateSet.add(key))
  return Array.from(candidateSet)
}

function parseTimeToMinutes(time: string) {
  const match = time.match(/^(\d{2}):(\d{2})$/)
  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return (hours * 60) + minutes
}

function formatMinutesToTimeKey(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`
}

function buildRangeTimeKeys(startTime: string, endTime: string) {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (start === null || end === null) {
    return []
  }
  if (start > end) {
    return []
  }

  const roundedStart = Math.floor(start / 10) * 10
  const roundedEnd = Math.floor(end / 10) * 10
  const keys: string[] = []

  for (let minute = roundedStart; minute <= roundedEnd; minute += 10) {
    keys.push(formatMinutesToTimeKey(minute))
  }

  return keys
}

function pickBestStation(keyword: string, list: RiverSearchItem[]) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) {
    return null
  }

  const exact = list.find(item => item.obsNm?.toLowerCase() === normalizedKeyword)
  if (exact) {
    return exact
  }

  const includes = list.find(item => [item.obsNm, item.rvrNm, item.rsysNm, item.adr]
    .filter(Boolean)
    .some(text => text.toLowerCase().includes(normalizedKeyword)))
  return includes ?? list[0] ?? null
}

function validateSiteName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 100) {
    throw new Error('観測所名は1〜100文字で入力してください')
  }
  return trimmed
}

async function fetchWaterLevelDirectly(siteName: string, dateTime: string) {
  const safeName = validateSiteName(siteName)
  const searchUrl = `${WATER_LEVEL_SOURCE_URL}/api/search/list/${encodeURIComponent(safeName)}/obsNm,rsysNm,rvrNm,obsAdr/4`
  const searchResponse = await fetch(searchUrl)
  if (!searchResponse.ok) {
    throw new Error(`観測所検索に失敗しました (${searchResponse.status})`)
  }

  const searchData = (await searchResponse.json()) as RiverSearchResponse
  const station = pickBestStation(siteName, searchData.result?.list ?? [])
  if (!station) {
    throw new Error('該当する観測所が見つかりませんでした')
  }

  const dateKey = getDateKey(dateTime)
  if (!dateKey) {
    throw new Error('日時の形式が不正です。YYYY-MM-DD 形式で指定してください')
  }

  const primaryTime = getPrimaryTimeKey(dateTime)
  const timeKeys = buildCandidateTimeKeys(primaryTime)
  const obsFcd = buildObsFcd(station)

  for (const timeKey of timeKeys) {
    const levelUrl = `${WATER_LEVEL_SOURCE_URL}/kawabou/file/files/tmlist/stg/${dateKey}/${timeKey}/${obsFcd}.json`
    const levelResponse = await fetch(levelUrl)
    if (!levelResponse.ok) {
      continue
    }

    const levelData = (await levelResponse.json()) as RiverLevelResponse
    const parsed = parseStgValue(levelData.obsValue?.stg)
    // 閉局・欠測等の状態文字列 → そのまま返す
    if (typeof parsed === 'string') {
      return parsed
    }
    if (parsed !== null) {
      return parsed
    }
  }

  return null
}

async function fetchStationByName(siteName: string) {
  const safeName = validateSiteName(siteName)
  const searchUrl = `${WATER_LEVEL_SOURCE_URL}/api/search/list/${encodeURIComponent(safeName)}/obsNm,rsysNm,rvrNm,obsAdr/4`
  const searchResponse = await fetch(searchUrl)
  if (!searchResponse.ok) {
    throw new Error(`観測所検索に失敗しました (${searchResponse.status})`)
  }

  const searchData = (await searchResponse.json()) as RiverSearchResponse
  const station = pickBestStation(siteName, searchData.result?.list ?? [])
  if (!station) {
    throw new Error('該当する観測所が見つかりませんでした')
  }

  return station
}

async function fetchWaterLevelByStationAndTimeKey(obsFcd: string, dateKey: string, timeKey: string) {
  const levelUrl = `${WATER_LEVEL_SOURCE_URL}/kawabou/file/files/tmlist/stg/${dateKey}/${timeKey}/${obsFcd}.json`
  const levelResponse = await fetch(levelUrl)
  if (!levelResponse.ok) {
    return null
  }

  const levelData = (await levelResponse.json()) as RiverLevelResponse
    // 閉局判定ロジックは撤廃
  return parseStgValue(levelData.obsValue?.stg)
}

export async function fetchAverageWaterLevelBySiteDateRange(
  siteName: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<WaterLevelDetail> {
  const cacheKey = `range:${siteName}:${date}:${startTime}:${endTime}`
  const cached = getCached<WaterLevelDetail>(cacheKey)
  if (cached !== null) return cached

  const result = await fetchAverageWaterLevelBySiteDateRangeInner(siteName, date, startTime, endTime)
  setCache(cacheKey, result)
  return result
}

async function fetchAverageWaterLevelBySiteDateRangeInner(
  siteName: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<WaterLevelDetail> {
  const dateKey = getDateKey(date)
  if (!dateKey) {
    throw new Error('日付の形式が不正です。YYYY-MM-DD 形式で指定してください')
  }

  const rangeKeys = buildRangeTimeKeys(startTime, endTime)
  if (rangeKeys.length === 0) {
    throw new Error('開始時間と終了時間を正しく入力してください')
  }

  if (USE_DIRECT_RIVER_API) {
    const station = await fetchStationByName(siteName)
    const obsFcd = buildObsFcd(station)

    const values: number[] = []
    for (const timeKey of rangeKeys) {
      const value = await fetchWaterLevelByStationAndTimeKey(obsFcd, dateKey, timeKey)
      // 閉局・欠測等の状態文字列 → エラーとして投げる
      if (typeof value === 'string') {
        throw new Error(value)
      }
      if (value !== null) {
        values.push(value)
      }
    }

    if (values.length > 0) {
      const average = values.reduce((sum, value) => sum + value, 0) / values.length
      return {
        startLevel: values[0],
        endLevel: values[values.length - 1],
        average,
      }
    }

    if (!WATER_LEVEL_API_URL) {
      throw new Error('指定時間帯の水位データが見つかりませんでした（閉局・欠測の可能性があります）')
    }
  }

  if (!WATER_LEVEL_API_URL) {
    throw new Error('水位取得APIのURLが未設定です。VITE_WATER_LEVEL_API_URL を設定してください。')
  }

  const params = new URLSearchParams({
    siteName,
    date,
    startTime,
    endTime,
  })

  const response = await fetch(`${WATER_LEVEL_API_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`水位取得APIの呼び出しに失敗しました (${response.status})`)
  }

  const data = (await response.json()) as Partial<WaterLevelApiResponse>
  const waterLevel = Number(data.waterLevel)
  if (!Number.isFinite(waterLevel)) {
    throw new Error('水位取得APIのレスポンス形式が不正です。waterLevel を返す必要があります。')
  }

  return { startLevel: null, endLevel: null, average: waterLevel }
}

export async function fetchWaterLevelBySiteDate(siteName: string, dateTime: string) {
  const cacheKey = `single:${siteName}:${dateTime}`
  const cached = getCached<number>(cacheKey)
  if (cached !== null) return cached

  const result = await fetchWaterLevelBySiteDateInner(siteName, dateTime)
  setCache(cacheKey, result)
  return result
}

async function fetchWaterLevelBySiteDateInner(siteName: string, dateTime: string) {
  if (USE_DIRECT_RIVER_API) {
    try {
      return await fetchWaterLevelDirectly(siteName, dateTime)
    } catch (error) {
      if (!WATER_LEVEL_API_URL) {
        const message = error instanceof Error ? error.message : '水位の直接取得に失敗しました'
        throw new Error(
          `${message}。必要に応じて VITE_WATER_LEVEL_API_URL に中継APIを設定してください。`,
        )
      }
    }
  }

  if (!WATER_LEVEL_API_URL) {
    throw new Error('水位取得APIのURLが未設定です。VITE_WATER_LEVEL_API_URL を設定してください。')
  }

  const params = new URLSearchParams({
    siteName,
    dateTime,
  })

  const response = await fetch(`${WATER_LEVEL_API_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`水位取得APIの呼び出しに失敗しました (${response.status})`)
  }

  const data = (await response.json()) as Partial<WaterLevelApiResponse>
  const waterLevel = Number(data.waterLevel)
  if (!Number.isFinite(waterLevel)) {
    throw new Error('水位取得APIのレスポンス形式が不正です。waterLevel を返す必要があります。')
  }

  return waterLevel
}
