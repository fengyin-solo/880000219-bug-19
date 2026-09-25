<script setup>
import { riskMeta } from '../../utils/restorationFormatters'
import { useEnvironmentMonitor } from '../../composables/useEnvironmentMonitor'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const { rooms, summariesByRoom } = useEnvironmentMonitor()

function roomLabel(roomId) {
  return rooms.find((room) => room.id === roomId)?.label ?? roomId
}

function environmentHint(roomId) {
  const summary = summariesByRoom.value[roomId]
  if (!summary || summary.isPending) {
    return { text: `环境：${roomLabel(roomId)} · 等待读数`, tone: 'pending' }
  }
  if (summary.abnormalCount === 0) {
    return { text: `环境：${roomLabel(roomId)} · 正常`, tone: 'normal' }
  }
  const confirmText =
    summary.pendingCount > 0 ? `待确认 ${summary.pendingCount} 项` : '均已确认'
  return {
    text: `环境：${roomLabel(roomId)} · 异常 ${summary.abnormalCount} 项（${confirmText}）`,
    tone: 'abnormal',
  }
}
</script>

<template>
  <div class="batch-grid">
    <article
      v-for="item in items"
      :key="item.code"
      class="batch-card"
    >
      <div class="batch-head">
        <small>批次 {{ item.code }}</small>
        <span :class="['risk-pill', `risk-pill--${riskMeta(item.risk).tone}`]">
          {{ riskMeta(item.risk).label }}
        </span>
      </div>
      <h4>{{ item.title }}</h4>
      <p>页码：{{ item.pages }}</p>
      <p>阶段：{{ item.status }}</p>
      <small :class="['env-hint', `env-hint--${environmentHint(item.room).tone}`]">
        {{ environmentHint(item.room).text }}
      </small>
      <small>{{ item.note }}</small>
    </article>
  </div>
</template>

<style scoped>
.batch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.batch-card {
  padding: 18px;
  border-radius: 20px;
  background: #f4ebda;
  border: 1px solid rgba(109, 80, 40, 0.08);
}

.batch-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

h4,
p,
small {
  margin: 0;
}

h4 {
  font-size: 1.04rem;
  margin-top: 10px;
}

p,
small {
  color: #6a5439;
}

p + p,
p + small,
small + small {
  margin-top: 6px;
}

.env-hint {
  display: block;
  font-weight: 600;
}

.env-hint--normal {
  color: #366338;
}

.env-hint--abnormal {
  color: #913d2f;
}

.env-hint--pending {
  color: #7e6038;
}

.risk-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
}

.risk-pill--high {
  background: #efd0c9;
  color: #913d2f;
}

.risk-pill--medium {
  background: #f6e5b9;
  color: #8b6314;
}

.risk-pill--low {
  background: #d9ead9;
  color: #366338;
}

@media (max-width: 960px) {
  .batch-grid {
    grid-template-columns: 1fr;
  }
}
</style>
