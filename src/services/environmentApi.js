// 纯前端原型：用脚本化结果模拟修复室环境轮询接口。
// 每条读数用 { value } / { error } 表达：
// - { value: 数字 } 指标上报成功
// - { value: null }   请求成功但该指标缺失
// - { error: true }   该指标请求失败
// 脚本整步为 null 时表示整次请求失败（网络错误）。

const roomScripts = {
  'room-1': [
    { humidity: { value: 52 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 52 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 52 }, pulp: { error: true }, uv: { value: 4 } },
    { humidity: { value: 52 }, pulp: { error: true }, uv: { value: 4 } },
    { humidity: { value: 52 }, pulp: { value: null }, uv: { value: 4 } },
    { humidity: { value: 47 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 47 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 53 }, pulp: { value: 2 }, uv: { value: 4 } },
  ],
  'room-2': [
    { humidity: { value: 52 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 52 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 59 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 59 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 59 }, pulp: { value: null }, uv: { value: 4 } },
    null,
    { humidity: { value: 59 }, pulp: { value: 2 }, uv: { value: 4 } },
    { humidity: { value: 53 }, pulp: { value: 2 }, uv: { value: 4 } },
  ],
  'room-3': [
    { humidity: { value: 51 }, pulp: { value: 1 }, uv: { value: 6 } },
    { humidity: { value: 51 }, pulp: { value: 1 }, uv: { value: 6 } },
    { humidity: { value: 51 }, pulp: { error: true }, uv: { value: 6 } },
    { humidity: { value: 44 }, pulp: { value: 1 }, uv: { value: 6 } },
    { humidity: { value: 44 }, pulp: { value: 1 }, uv: { value: null } },
    null,
    { humidity: { value: 54 }, pulp: { value: 1 }, uv: { value: 6 } },
    { humidity: { value: 54 }, pulp: { value: 1 }, uv: { value: 6 } },
  ],
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

// 返回 { step, metrics }；整次请求失败时抛出错误。
export async function fetchRoomEnvironment(roomId, step) {
  const script = roomScripts[roomId]
  if (!script) {
    throw new Error(`未知修复室：${roomId}`)
  }

  await delay(240)

  const entry = script[step % script.length]
  if (entry === null) {
    throw new Error('环境监测请求失败，请稍后重试')
  }

  return { step, metrics: entry }
}
