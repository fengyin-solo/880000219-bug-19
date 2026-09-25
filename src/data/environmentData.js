export const restorationRooms = [
  { id: 'room-1', label: '修复室 1' },
  { id: 'room-2', label: '修复室 2' },
  { id: 'room-3', label: '修复室 3' },
]

export const defaultRoomId = 'room-2'

export const environmentMetrics = [
  {
    key: 'humidity',
    label: '相对湿度',
    unit: '%',
    controlLine: { min: 50, max: 55, text: '控制线 50% - 55%' },
    note: '',
  },
  {
    key: 'pulp',
    label: '纸浆补配',
    unit: ' 批',
    controlLine: { min: 1, max: 3, text: '控制线 1 - 3 批' },
    note: '桑皮纤维待过滤',
  },
  {
    key: 'uv',
    label: '紫外检查',
    unit: ' 页',
    controlLine: { min: 0, max: 6, text: '控制线 0 - 6 页' },
    note: '夜间统一复核霉斑残留',
  },
]
