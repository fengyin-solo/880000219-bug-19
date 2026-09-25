import { environmentMetrics } from '../data/environmentData'

// 每个修复室的轮询脚本：按 tick 依次轮换，覆盖正常、数值超界、缺少指标三种读数；
// 每 5 次请求模拟一次请求失败，便于验证异常归类与确认流程。
const roomScripts = {
  'room-1': [
    { humidity: 52, pulp: 2, uv: 4 },
    { humidity: 58, pulp: 2, uv: 4 },
    { humidity: 53, pulp: null, uv: 4 },
    { humidity: 51, pulp: 2, uv: 9 },
  ],
  'room-2': [
    { humidity: 52, pulp: 2, uv: 4 },
    { humidity: 52, pulp: 5, uv: 4 },
    { humidity: null, pulp: 2, uv: 4 },
    { humidity: 48, pulp: 2, uv: 4 },
  ],
  'room-3': [
    { humidity: 54, pulp: 1, uv: 2 },
    { humidity: 54, pulp: 1, uv: 8 },
    { humidity: 61, pulp: null, uv: 2 },
    { humidity: 54, pulp: 1, uv: 2 },
  ],
}

const roomTicks = new Map()

export function fetchEnvironmentReadings(roomId) {
  const tick = (roomTicks.get(roomId) ?? 0) + 1
  roomTicks.set(roomId, tick)

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (tick % 5 === 0) {
        reject(new Error(`环境接口请求失败（${roomId}）`))
        return
      }
      const script = roomScripts[roomId] ?? roomScripts['room-1']
      const snapshot = script[(tick - 1) % script.length]
      const readings = {}
      for (const metric of environmentMetrics) {
        const value = snapshot[metric.key]
        readings[metric.key] = value === undefined ? null : value
      }
      resolve({ roomId, readings, fetchedAt: Date.now() })
    }, 300)
  })
}
