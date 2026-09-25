export function riskMeta(risk) {
  const map = {
    high: {
      label: '高',
      tone: 'high',
    },
    medium: {
      label: '中',
      tone: 'medium',
    },
    low: {
      label: '低',
      tone: 'low',
    },
  }

  return map[risk] ?? map.low
}

export function formatMetricValue(metric, value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--'
  }
  return `${value}${metric.unit ? ` ${metric.unit}` : ''}`
}

// 读数归类：请求失败、缺少指标、数值超界、正常各自得到可确认状态。
// 入参：
// - metric 指标定义（含 min/max 控制线）
// - raw   接口读数 { value }（value 为 null 表示缺少指标）或 null（请求失败）
export function classifyReading(metric, raw) {
  if (raw === null) {
    return { status: 'failed', value: null }
  }
  if (raw.value === null || raw.value === undefined) {
    return { status: 'missing', value: null }
  }

  const { value } = raw
  if (
    typeof value !== 'number' ||
    Number.isNaN(value) ||
    (typeof metric.min === 'number' && value < metric.min) ||
    (typeof metric.max === 'number' && value > metric.max)
  ) {
    return { status: 'out-of-range', value }
  }

  return { status: 'normal', value }
}

export const readingStatusMeta = {
  normal: {
    label: '正常',
    tone: 'normal',
    confirmable: false,
  },
  'out-of-range': {
    label: '数值超界',
    tone: 'danger',
    confirmable: true,
  },
  missing: {
    label: '缺少指标',
    tone: 'warning',
    confirmable: true,
  },
  failed: {
    label: '请求失败',
    tone: 'warning',
    confirmable: true,
  },
}

export function formatReadingTime(observedAt) {
  if (!observedAt) {
    return '尚无读数'
  }
  const time = new Date(observedAt)
  if (Number.isNaN(time.getTime())) {
    return '尚无读数'
  }
  const pad = (part) => String(part).padStart(2, '0')
  return `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(
    time.getSeconds(),
  )}`
}
