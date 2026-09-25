import { computed, reactive, watch } from 'vue'

import {
  defaultRoomId,
  restorationMetrics,
  restorationRooms,
} from '../data/restorationData'
import { fetchRoomEnvironment } from '../services/environmentApi'
import { classifyReading } from '../utils/restorationFormatters'

const STORAGE_KEY = 'restoration-environment-v1'
const POLL_INTERVAL = 4000

// 三类异常必须分别统计、分别确认。
export const ABNORMAL_STATUSES = ['out-of-range', 'missing', 'failed']

function ensureRoom(state, roomId) {
  if (!state.rooms[roomId]) {
    state.rooms[roomId] = { step: 0, updatedAt: null, readings: {} }
  }
  return state.rooms[roomId]
}

function loadState() {
  const fallback = { selectedRoomId: defaultRoomId, rooms: {} }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }
    const parsed = JSON.parse(raw)
    return {
      selectedRoomId: restorationRooms.some(
        (room) => room.id === parsed?.selectedRoomId,
      )
        ? parsed.selectedRoomId
        : defaultRoomId,
      rooms:
        parsed?.rooms && typeof parsed.rooms === 'object' ? parsed.rooms : {},
    }
  } catch {
    return fallback
  }
}

// 模块级单例：环境总览面板与批次列表共用同一份状态与计数。
const state = reactive(loadState())
const monitorState = reactive({ isPolling: false })

let saveTimer = null
watch(
  state,
  () => {
    try {
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }, 120)
    } catch {
      /* 本地存储不可用时仅保留本轮内存状态 */
    }
  },
  { deep: true },
)

// 合并一轮轮询读数。已确认结果若与本轮读数完全一致，重复轮询不得覆盖；
// 读数发生变化时另立一条待确认观测，最近确认值继续保留。
function applyObservation(roomId, metricId, raw) {
  const room = ensureRoom(state, roomId)
  const metric = restorationMetrics.find((item) => item.id === metricId)
  const { status, value } = classifyReading(metric ?? {}, raw)
  const current = room.readings[metricId]

  if (
    current &&
    current.confirmed &&
    current.status === status &&
    current.value === value
  ) {
    return
  }

  const observedAt = new Date().toISOString()
  room.readings[metricId] = {
    status,
    value,
    confirmed: false,
    observedAt,
    lastConfirmedStatus: current?.lastConfirmedStatus ?? null,
    lastConfirmedValue: current?.lastConfirmedValue ?? null,
    lastConfirmedAt: current?.lastConfirmedAt ?? null,
  }
  room.updatedAt = observedAt
}

function confirmReading(roomId, metricId) {
  const room = ensureRoom(state, roomId)
  const reading = room.readings[metricId]
  if (
    !reading ||
    !ABNORMAL_STATUSES.includes(reading.status) ||
    reading.confirmed
  ) {
    return
  }
  reading.confirmed = true
  reading.lastConfirmedStatus = reading.status
  reading.lastConfirmedValue = reading.value
  reading.lastConfirmedAt = new Date().toISOString()
  room.updatedAt = reading.lastConfirmedAt
}

const inflight = new Set()
let pollTimer = null

async function pollRoom(roomId) {
  if (inflight.has(roomId)) {
    return
  }
  inflight.add(roomId)
  const room = ensureRoom(state, roomId)
  const step = room.step
  try {
    const result = await fetchRoomEnvironment(roomId, step)
    for (const metric of restorationMetrics) {
      // 请求成功但未携带该指标，按“缺少指标”处理；缺失键同样视为缺少。
      applyObservation(
        roomId,
        metric.id,
        result.metrics[metric.id] === undefined
          ? { value: null }
          : result.metrics[metric.id],
      )
    }
    room.step = result.step + 1
  } catch {
    // 整次请求失败：每个指标分别落为“请求失败”，且不覆盖已确认结果。
    for (const metric of restorationMetrics) {
      applyObservation(roomId, metric.id, null)
    }
    room.step = step + 1
  } finally {
    inflight.delete(roomId)
  }
}

function startPolling() {
  if (pollTimer !== null) {
    return
  }
  monitorState.isPolling = true
  pollRoom(state.selectedRoomId)
  pollTimer = window.setInterval(() => {
    pollRoom(state.selectedRoomId)
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer === null) {
    return
  }
  window.clearInterval(pollTimer)
  pollTimer = null
  monitorState.isPolling = false
}

// 切换修复室后立即拉取该室读数；各室读数分键存放，旧读数不会串到当前室。
function selectRoom(roomId) {
  if (
    !restorationRooms.some((room) => room.id === roomId) ||
    roomId === state.selectedRoomId
  ) {
    return
  }
  state.selectedRoomId = roomId
  pollRoom(roomId)
}

const summaryCache = new Map()

function roomSummary(roomId) {
  if (!summaryCache.has(roomId)) {
    summaryCache.set(
      roomId,
      computed(() => {
        const room = state.rooms[roomId]
        const readings = restorationMetrics.map((metric) => ({
          ...metric,
          reading: room?.readings[metric.id] ?? null,
        }))

        let polled = 0
        let abnormal = 0
        let unconfirmed = 0
        let outOfRange = 0
        let missing = 0
        let failed = 0
        const abnormalLabels = []

        for (const entry of readings) {
          const reading = entry.reading
          if (!reading) {
            continue
          }
          polled += 1
          if (ABNORMAL_STATUSES.includes(reading.status)) {
            abnormal += 1
            abnormalLabels.push(entry.label)
            if (reading.status === 'out-of-range') {
              outOfRange += 1
            } else if (reading.status === 'missing') {
              missing += 1
            } else if (reading.status === 'failed') {
              failed += 1
            }
            if (!reading.confirmed) {
              unconfirmed += 1
            }
          }
        }

        let risk = 'idle'
        if (polled > 0) {
          const current = readings.map((entry) => entry.reading)
          if (
            current.some(
              (reading) =>
                reading?.status === 'out-of-range' && !reading.confirmed,
            )
          ) {
            risk = 'high'
          } else if (
            current.some(
              (reading) =>
                (reading?.status === 'missing' ||
                  reading?.status === 'failed') &&
                !reading.confirmed,
            )
          ) {
            risk = 'medium'
          } else {
            risk = 'low'
          }
        }

        return {
          readings,
          polled,
          abnormal,
          unconfirmed,
          outOfRange,
          missing,
          failed,
          abnormalLabels,
          risk,
          updatedAt: room?.updatedAt ?? null,
        }
      }),
    )
  }
  return summaryCache.get(roomId)
}

export function useEnvironmentMonitor() {
  return {
    state,
    monitorState,
    rooms: restorationRooms,
    metrics: restorationMetrics,
    selectedRoomId: computed(() => state.selectedRoomId),
    isPolling: computed(() => monitorState.isPolling),
    roomSummary,
    pollRoom,
    startPolling,
    stopPolling,
    selectRoom,
    confirmReading,
  }
}
