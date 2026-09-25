<script setup>
import { environmentStatusMeta } from '../../utils/restorationFormatters'
import { isAbnormalStatus } from '../../composables/useEnvironmentMonitor'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['confirm'])

function displayValue(item) {
  return item.value === null ? '—' : `${item.value}${item.unit}`
}

function confirmable(item) {
  return isAbnormalStatus(item.status) && !item.confirmed
}
</script>

<template>
  <div class="environment-grid">
    <article
      v-for="item in items"
      :key="item.key"
      :class="['environment-card', `environment-card--${environmentStatusMeta(item.status).tone}`]"
    >
      <div class="card-head">
        <span>{{ item.label }}</span>
        <span :class="['status-pill', `status-pill--${environmentStatusMeta(item.status).tone}`]">
          {{ environmentStatusMeta(item.status).label }}
        </span>
        <span v-if="item.confirmed" class="status-pill status-pill--confirmed">已确认</span>
      </div>
      <strong>{{ displayValue(item) }}</strong>
      <p class="control-line">{{ item.controlText }}</p>
      <p v-if="item.note">{{ item.note }}</p>
      <button
        v-if="confirmable(item)"
        type="button"
        class="confirm-button"
        @click="emit('confirm', item.key)"
      >
        确认
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
  padding: 18px;
  border-radius: 18px;
  background: #fbf5ea;
  border: 1px dashed rgba(121, 88, 47, 0.22);
}

.environment-card--out-of-range,
.environment-card--missing,
.environment-card--error {
  border-style: solid;
  border-color: rgba(145, 61, 47, 0.35);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

span,
strong,
p {
  display: block;
  margin: 0;
}

.card-head > span:first-child {
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

.control-line {
  color: #82684b;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  white-space: nowrap;
}

.status-pill--normal {
  background: #d9ead9;
  color: #366338;
}

.status-pill--out-of-range {
  background: #efd0c9;
  color: #913d2f;
}

.status-pill--missing {
  background: #f6e5b9;
  color: #8b6314;
}

.status-pill--error {
  background: #e4d4ee;
  color: #5f3d7a;
}

.status-pill--pending {
  background: #eee7da;
  color: #7e6038;
}

.status-pill--confirmed {
  background: #d7e4f2;
  color: #2f5677;
}

.confirm-button {
  margin-top: 12px;
  padding: 7px 14px;
  border: none;
  border-radius: 999px;
  background: #79582f;
  color: #fff8eb;
  font-size: 0.8rem;
  cursor: pointer;
}

.confirm-button:hover {
  background: #5f4423;
}

@media (max-width: 960px) {
  .environment-grid {
    grid-template-columns: 1fr;
  }
}
</style>
