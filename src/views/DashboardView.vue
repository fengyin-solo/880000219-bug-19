<script setup>
import { computed } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import StatCard from '../components/common/StatCard.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import EnvironmentCards from '../components/restoration/EnvironmentCards.vue'
import HeroBanner from '../components/restoration/HeroBanner.vue'
import {
  restorationBatches,
  restorationHero,
  restorationSteps,
} from '../data/restorationData'
import { useEnvironmentMonitor } from '../composables/useEnvironmentMonitor'
import { useRestorationOverview } from '../composables/useRestorationOverview'

const { batchCount, environmentCount, highRiskCount, ownerCount } =
  useRestorationOverview()
const {
  rooms,
  activeRoomId,
  activeRoomState,
  activeReadings,
  metricCount,
  normalCount,
  abnormalCount,
  pendingConfirmCount,
  setActiveRoom,
  confirmReading,
} = useEnvironmentMonitor()

const statCards = computed(() => [
  { label: '在册批次', value: batchCount.value },
  { label: '高风险任务', value: highRiskCount.value },
  { label: '环境指标', value: environmentCount.value },
  { label: '参与修复师', value: ownerCount.value },
])

const activeRoomLabel = computed(
  () => rooms.find((room) => room.id === activeRoomId.value)?.label ?? '',
)

const environmentSummary = computed(() => {
  if (abnormalCount.value === 0) {
    return `指标 ${metricCount.value} 项 · 正常 ${normalCount.value} 项`
  }
  return `指标 ${metricCount.value} 项 · 正常 ${normalCount.value} 项 · 异常 ${abnormalCount.value} 项（待确认 ${pendingConfirmCount.value} 项）`
})

const updatedAtText = computed(() => {
  const updatedAt = activeRoomState.value.updatedAt
  if (!updatedAt) return '尚未获取读数'
  return `更新于 ${new Date(updatedAt).toLocaleTimeString('zh-CN', { hour12: false })}`
})
</script>

<template>
  <div class="view-stack">
    <HeroBanner :hero="restorationHero" />

    <section class="stats-grid">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
      />
    </section>

    <section class="two-column">
      <PanelSection title="重点批次" badge="优先处理">
        <BatchGrid :items="restorationBatches" />
      </PanelSection>

      <PanelSection title="当日工序" badge="修复流程">
        <ol class="step-list">
          <li v-for="step in restorationSteps" :key="step">{{ step }}</li>
        </ol>
      </PanelSection>
    </section>

    <PanelSection title="环境参数" :badge="activeRoomLabel">
      <div class="room-switcher">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          :class="['room-tab', { 'room-tab--active': room.id === activeRoomId }]"
          @click="setActiveRoom(room.id)"
        >
          {{ room.label }}
        </button>
      </div>
      <p class="environment-summary">
        {{ environmentSummary }} · {{ updatedAtText }}
      </p>
      <p v-if="activeRoomState.lastError" class="environment-error">
        {{ activeRoomState.lastError }}，已确认读数保持不变
      </p>
      <EnvironmentCards
        :items="activeReadings"
        @confirm="confirmReading(activeRoomId, $event)"
      />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.two-column {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
}

.step-list {
  margin: 0;
  padding-left: 20px;
  color: #5c4a33;
}

.step-list li + li {
  margin-top: 12px;
}

.room-switcher {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.room-tab {
  padding: 8px 16px;
  border: 1px solid rgba(121, 88, 47, 0.3);
  border-radius: 999px;
  background: transparent;
  color: #6a5439;
  font-size: 0.84rem;
  cursor: pointer;
}

.room-tab--active {
  background: #79582f;
  border-color: #79582f;
  color: #fff8eb;
}

.environment-summary {
  margin: 0 0 6px;
  color: #5c4a33;
  font-size: 0.9rem;
}

.environment-error {
  margin: 0 0 6px;
  color: #913d2f;
  font-size: 0.86rem;
}

.environment-summary,
.environment-error {
  line-height: 1.5;
}

.environment-error:last-of-type,
.environment-summary:last-of-type {
  margin-bottom: 14px;
}

@media (max-width: 980px) {
  .stats-grid,
  .two-column {
    grid-template-columns: 1fr;
  }
}
</style>
