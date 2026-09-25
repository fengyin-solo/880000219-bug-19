export function environmentStatusMeta(status) {
  const map = {
    pending: {
      label: '等待读数',
      tone: 'pending',
    },
    normal: {
      label: '正常',
      tone: 'normal',
    },
    'out-of-range': {
      label: '数值超界',
      tone: 'out-of-range',
    },
    missing: {
      label: '缺少指标',
      tone: 'missing',
    },
    error: {
      label: '请求失败',
      tone: 'error',
    },
  }

  return map[status] ?? map.pending
}

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
