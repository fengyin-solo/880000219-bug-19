<script setup>
import { computed } from 'vue'

import { useEnvironmentMonitor } from '../../composables/useEnvironmentMonitor'
import { riskMeta } from '../../utils/restorationFormatters'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const { rooms, roomSummary } = useEnvironmentMonitor()

const envRiskMeta = {
  idle: { label: '暂无读数', tone: 'idle' },
  high: { label: '环境高风险', tone: 'high' },
  medium: { label: '环境待处理', tone: 'medium' },
  low: { label: '环境正常', tone: 'low' },
}

function roomName(roomId) {
  return rooms.find((room) => room.id === roomId)?.name ?? roomId
}

const decorated = computed(() =>
  props.items.map((item) => {
    const summary = roomSummary(item.roomId).value
    return {
      ...item,
      roomName: roomName(item.roomId),
      envRisk: summary.risk,
      envUnconfirmed: summary.unconfirmed,
      envAbnormalLabels: summary.abnormalLabels,
    }
  }),
)
</script>

<template>
  <div class="batch-grid">
    <article
      v-for="item in decorated"
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
      <p>修复室：{{ item.roomName }}</p>
      <div class="batch-head env-row">
        <span
          :class="[
            'risk-pill',
            `risk-pill--${envRiskMeta[item.envRisk].tone}`,
          ]"
        >
          {{ envRiskMeta[item.envRisk].label }}
        </span>
        <small v-if="item.envUnconfirmed > 0">
          待确认 {{ item.envUnconfirmed }} 项
        </small>
      </div>
      <small v-if="item.envAbnormalLabels.length" class="env-detail">
        异常指标：{{ item.envAbnormalLabels.join('、') }}
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

.env-row {
  margin-top: 8px;
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
p + small {
  margin-top: 6px;
}

small + small,
.env-detail {
  display: block;
  margin-top: 6px;
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

.risk-pill--idle {
  background: #ece3d3;
  color: #8a7659;
}

@media (max-width: 960px) {
  .batch-grid {
    grid-template-columns: 1fr;
  }
}
</style>
