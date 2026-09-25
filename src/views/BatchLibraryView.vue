<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import EnvironmentCards from '../components/restoration/EnvironmentCards.vue'
import RoomSwitcher from '../components/restoration/RoomSwitcher.vue'
import { restorationBatches } from '../data/restorationData'
import { useEnvironmentMonitor } from '../composables/useEnvironmentMonitor'

const {
  rooms,
  selectedRoomId,
  roomSummary,
  startPolling,
  stopPolling,
} = useEnvironmentMonitor()

const selectedRoom = computed(
  () => rooms.find((room) => room.id === selectedRoomId.value) ?? rooms[0],
)
const selectedSummary = computed(
  () => roomSummary(selectedRoomId.value).value,
)

onMounted(startPolling)
onUnmounted(stopPolling)
</script>

<template>
  <div class="view-stack">
    <PanelSection
      title="批次档案"
      :badge="`${selectedRoom.name} · 异常 ${selectedSummary.abnormal} / 待确认 ${selectedSummary.unconfirmed}`"
    >
      <p class="env-summary">
        超界 {{ selectedSummary.outOfRange }} · 缺少 {{ selectedSummary.missing }}
        · 请求失败 {{ selectedSummary.failed }} · 已确认
        {{ selectedSummary.abnormal - selectedSummary.unconfirmed }}
      </p>
      <BatchGrid :items="restorationBatches" />
    </PanelSection>

    <PanelSection title="修复室环境" :badge="selectedRoom.name">
      <RoomSwitcher />
      <EnvironmentCards :room-id="selectedRoomId" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.env-summary {
  margin: 0 0 16px;
  color: #6a5439;
  font-size: 0.9rem;
}
</style>
