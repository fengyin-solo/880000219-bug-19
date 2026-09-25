<script setup>
import { useEnvironmentMonitor } from '../../composables/useEnvironmentMonitor'

const {
  rooms,
  selectedRoomId,
  isPolling,
  roomSummary,
  selectRoom,
  pollRoom,
  startPolling,
  stopPolling,
} = useEnvironmentMonitor()

function roomClass(roomId) {
  return {
    'room-tab': true,
    'room-tab--active': roomId === selectedRoomId.value,
    [`room-tab--${roomSummary(roomId).value.risk}`]: true,
  }
}

function roomCount(roomId) {
  return roomSummary(roomId).value.unconfirmed
}

function refreshNow() {
  pollRoom(selectedRoomId.value)
}
</script>

<template>
  <div class="room-switcher">
    <button
      v-for="room in rooms"
      :key="room.id"
      type="button"
      :class="roomClass(room.id)"
      @click="selectRoom(room.id)"
    >
      <span>{{ room.name }}</span>
      <small v-if="roomCount(room.id) > 0">待确认 {{ roomCount(room.id) }}</small>
    </button>
    <span class="room-actions">
      <button type="button" class="poll-button" @click="refreshNow">
        立即轮询
      </button>
      <button
        type="button"
        class="poll-button"
        @click="isPolling ? stopPolling() : startPolling()"
      >
        {{ isPolling ? '暂停轮询' : '恢复轮询' }}
      </button>
    </span>
  </div>
</template>

<style scoped>
.room-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}

.room-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(121, 88, 47, 0.25);
  background: #fbf5ea;
  color: #5c4a33;
  cursor: pointer;
  font-size: 0.86rem;
}

.room-tab small {
  padding: 2px 8px;
  border-radius: 999px;
  background: #efd0c9;
  color: #913d2f;
}

.room-tab--active {
  border-color: #7e6038;
  background: #efe2ca;
}

.room-tab--high {
  box-shadow: inset 3px 0 0 #b0553f;
}

.room-tab--medium {
  box-shadow: inset 3px 0 0 #b88a2e;
}

.room-tab--low {
  box-shadow: inset 3px 0 0 #5d8a5f;
}

.room-actions {
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
}

.poll-button {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px dashed rgba(121, 88, 47, 0.35);
  background: transparent;
  color: #6a5439;
  cursor: pointer;
  font-size: 0.82rem;
}
</style>
