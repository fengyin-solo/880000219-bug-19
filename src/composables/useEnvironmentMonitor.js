import { computed, reactive, ref } from 'vue'

import {
  defaultRoomId,
  environmentMetrics,
  restorationRooms,
} from '../data/environmentData'
import { fetchEnvironmentReadings } from '../services/environmentService'

const STORAGE_KEY = 'restoration-environment-confirmed'
const POLL_INTERVAL = 4000

export const ENVIRONMENT_STATUS = {
  PENDING: 'pending',
  NORMAL: 'normal',
  OUT_OF_RANGE: 'out-of-range',
  MISSING: 'missing',
  ERROR: 'error',
}

const ABNORMAL_STATUSES = new Set([
  ENVIRONMENT_STATUS.OUT_OF_RANGE,
  ENVIRONMENT_STATUS.MISSING,
  ENVIRONMENT_STATUS.ERROR,
])

export function isAbnormalStatus(status) {
  return ABNORMAL_STATUSES.has(status)
}

// 读数归类：缺指标 → missing，越出控制线 → out-of-range，其余 → normal
function classifyValue(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return ENVIRONMENT_STATUS.MISSING
  }
  if (value < metric.controlLine.min || value > metric.controlLine.max) {
    return ENVIRONMENT_STATUS.OUT_OF_RANGE
  }
  return ENVIRONMENT_STATUS.NORMAL
}

function createReading(metric) {
  return {
    key: metric.key,
    label: metric.label,
    unit: metric.unit,
    controlText: metric.controlLine.text,
    note: metric.note,
    value: null,
    status: ENVIRONMENT_STATUS.PENDING,
    confirmed: false,
    confirmedAt: null,
  }
}

// 模块级单例状态：路由切换、组件重建都共享同一份读数，保证各区域计数一致
const roomStates = reactive({})
const activeRoomId = ref(defaultRoomId)
const pollingRooms = new Set()
let pollTimer = null

function ensureRoomState(roomId) {
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      status: 'idle',
      lastError: '',
      updatedAt: null,
      metrics: Object.fromEntries(
        environmentMetrics.map((metric) => [metric.key, createReading(metric)]),
      ),
    }
  }
  return roomStates[roomId]
}

function persistConfirmed() {
  try {
    const snapshot = {}
    for (const [roomId, room] of Object.entries(roomStates)) {
      for (const [key, reading] of Object.entries(room.metrics)) {
        if (reading.confirmed) {
          snapshot[roomId] = snapshot[roomId] ?? {}
          snapshot[roomId][key] = {
            value: reading.value,
            status: reading.status,
            confirmedAt: reading.confirmedAt,
          }
        }
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // 本地存储不可用时仅放弃持久化，不影响页面内状态
  }
}

function loadConfirmed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    for (const [roomId, metrics] of Object.entries(saved)) {
      const room = ensureRoomState(roomId)
      for (const [key, entry] of Object.entries(metrics ?? {})) {
        const reading = room.metrics[key]
        if (reading && entry) {
          Object.assign(reading, {
            value: entry.value,
            status: entry.status,
            confirmed: true,
            confirmedAt: entry.confirmedAt ?? null,
          })
        }
      }
    }
  } catch {
    // 存储内容损坏时按无确认记录处理
  }
}

// 刷新后恢复最近确认值
loadConfirmed()

function applyReadings(room, readings, fetchedAt) {
  room.updatedAt = fetchedAt
  for (const metric of environmentMetrics) {
    const reading = room.metrics[metric.key]
    if (reading.confirmed) continue // 已确认结果不被轮询覆盖
    const value = readings[metric.key] ?? null
    reading.value = value
    reading.status = classifyValue(metric, value)
  }
}

function applyRequestFailure(room, error) {
  room.status = 'error'
  room.lastError = error?.message ?? '请求失败'
  for (const metric of environmentMetrics) {
    const reading = room.metrics[metric.key]
    if (reading.confirmed) continue // 已确认结果不被失败覆盖
    reading.value = null
    reading.status = ENVIRONMENT_STATUS.ERROR
  }
}

async function pollRoom(roomId) {
  if (pollingRooms.has(roomId)) return
  pollingRooms.add(roomId)
  const room = ensureRoomState(roomId)
  room.status = 'loading'
  try {
    const { readings, fetchedAt } = await fetchEnvironmentReadings(roomId)
    applyReadings(room, readings, fetchedAt)
    room.status = 'ready'
    room.lastError = ''
  } catch (error) {
    applyRequestFailure(room, error)
  } finally {
    pollingRooms.delete(roomId)
  }
}

function pollAllRooms() {
  for (const room of restorationRooms) {
    pollRoom(room.id)
  }
}

const activeRoomState = computed(() => ensureRoomState(activeRoomId.value))

const activeReadings = computed(() =>
  environmentMetrics.map((metric) => activeRoomState.value.metrics[metric.key]),
)

const metricCount = computed(() => environmentMetrics.length)

const normalCount = computed(
  () =>
    activeReadings.value.filter(
      (reading) => reading.status === ENVIRONMENT_STATUS.NORMAL,
    ).length,
)

const abnormalReadings = computed(() =>
  activeReadings.value.filter((reading) => isAbnormalStatus(reading.status)),
)

const abnormalCount = computed(() => abnormalReadings.value.length)

const pendingConfirmCount = computed(
  () => abnormalReadings.value.filter((reading) => !reading.confirmed).length,
)

// 每个修复室的汇总，供批次列表等其它区域复用同一数据源
const summariesByRoom = computed(() => {
  const summaries = {}
  for (const room of restorationRooms) {
    const state = ensureRoomState(room.id)
    const readings = environmentMetrics.map((metric) => state.metrics[metric.key])
    const abnormal = readings.filter((reading) => isAbnormalStatus(reading.status))
    summaries[room.id] = {
      isPending: readings.every(
        (reading) => reading.status === ENVIRONMENT_STATUS.PENDING,
      ),
      abnormalCount: abnormal.length,
      pendingCount: abnormal.filter((reading) => !reading.confirmed).length,
    }
  }
  return summaries
})

export function useEnvironmentMonitor() {
  function setActiveRoom(roomId) {
    if (!restorationRooms.some((room) => room.id === roomId)) return
    activeRoomId.value = roomId
    ensureRoomState(roomId)
  }

  function confirmReading(roomId, metricKey) {
    const room = ensureRoomState(roomId)
    const reading = room.metrics[metricKey]
    if (!reading || !isAbnormalStatus(reading.status) || reading.confirmed) return
    reading.confirmed = true
    reading.confirmedAt = Date.now()
    persistConfirmed()
  }

  function startPolling() {
    stopPolling()
    pollAllRooms()
    pollTimer = setInterval(pollAllRooms, POLL_INTERVAL)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    rooms: restorationRooms,
    activeRoomId,
    activeRoomState,
    activeReadings,
    metricCount,
    normalCount,
    abnormalCount,
    pendingConfirmCount,
    summariesByRoom,
    setActiveRoom,
    confirmReading,
    startPolling,
    stopPolling,
  }
}
