<script setup>
import { computed } from 'vue'

import { useEnvironmentMonitor } from '../../composables/useEnvironmentMonitor'
import {
  formatMetricValue,
  formatReadingTime,
  readingStatusMeta,
} from '../../utils/restorationFormatters'

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
})

const { roomSummary, confirmReading } = useEnvironmentMonitor()

const summary = computed(() => roomSummary(props.roomId).value)
const cards = computed(() => summary.value.readings)

function meta(status) {
  return readingStatusMeta[status]
}

function currentValue(card) {
  const reading = card.reading
  if (!reading) {
    return '等待轮询'
  }
  return formatMetricValue(card, reading.value)
}
</script>

<template>
  <div class="environment-grid">
    <article
      v-for="card in cards"
      :key="card.id"
      class="environment-card"
      :class="card.reading ? `environment-card--${meta(card.reading.status).tone}` : ''"
    >
      <div class="card-head">
        <span>{{ card.label }}</span>
        <em
          v-if="card.reading"
          class="status-pill"
          :class="`status-pill--${meta(card.reading.status).tone}`"
        >
          {{ meta(card.reading.status).label }}
          <template v-if="card.reading.confirmed"> · 已确认</template>
        </em>
        <em v-else class="status-pill status-pill--idle">待轮询</em>
      </div>

      <strong>{{ currentValue(card) }}</strong>
      <p class="control-note">{{ card.note }}</p>

      <p v-if="card.reading" class="reading-time">
        最近读数 {{ formatReadingTime(card.reading.observedAt) }}
      </p>

      <p
        v-if="card.reading && card.reading.lastConfirmedStatus"
        class="confirmed-note"
      >
        最近确认：
        {{ meta(card.reading.lastConfirmedStatus).label }}
        <template v-if="card.reading.lastConfirmedValue !== null">
          ·
          {{ formatMetricValue(card, card.reading.lastConfirmedValue) }}
        </template>
        · {{ formatReadingTime(card.reading.lastConfirmedAt) }}
      </p>

      <button
        v-if="
          card.reading &&
          meta(card.reading.status).confirmable &&
          !card.reading.confirmed
        "
        type="button"
        class="confirm-button"
        @click="confirmReading(roomId, card.id)"
      >
        确认该异常
      </button>
    </article>
  </div>
</template>

<style scoped>
.environment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.environment-card {
  display: flex;
  flex-direction: column;
  padding: 18px;
  border-radius: 18px;
  background: #fbf5ea;
  border: 1px dashed rgba(121, 88, 47, 0.22);
}

.environment-card--danger {
  border-color: rgba(176, 85, 63, 0.55);
  background: #f9e8e3;
}

.environment-card--warning {
  border-color: rgba(184, 138, 46, 0.5);
  background: #faf2dd;
}

.environment-card--normal {
  border-style: solid;
  border-color: rgba(93, 138, 95, 0.35);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

span,
strong,
p {
  display: block;
  margin: 0;
}

span {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

strong {
  margin-top: 12px;
  font-size: 2rem;
}

p {
  margin-top: 8px;
  color: #6a5439;
}

.reading-time,
.confirmed-note {
  font-size: 0.78rem;
}

.confirmed-note {
  color: #366338;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-style: normal;
  font-size: 0.74rem;
  white-space: nowrap;
}

.status-pill--danger {
  background: #efd0c9;
  color: #913d2f;
}

.status-pill--warning {
  background: #f6e5b9;
  color: #8b6314;
}

.status-pill--normal {
  background: #d9ead9;
  color: #366338;
}

.status-pill--idle {
  background: #ece3d3;
  color: #8a7659;
}

.confirm-button {
  align-self: flex-start;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  border: none;
  background: #7e6038;
  color: #fff8ec;
  cursor: pointer;
  font-size: 0.8rem;
}

@media (max-width: 960px) {
  .environment-grid {
    grid-template-columns: 1fr;
  }
}
</style>
