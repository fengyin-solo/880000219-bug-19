<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import AppSidebar from './components/common/AppSidebar.vue'
import { restorationNavigation } from './data/restorationData'
import { useEnvironmentMonitor } from './composables/useEnvironmentMonitor'

const { startPolling, stopPolling } = useEnvironmentMonitor()

onMounted(startPolling)
onUnmounted(stopPolling)
</script>

<template>
  <div class="app-shell">
    <AppSidebar
      title="Conservation Desk"
      subtitle="古籍虫蛀修复"
      :items="restorationNavigation"
    />
    <div class="app-main">
      <AppHeader
        eyebrow="Studio Console"
        title="文献修复流程工作台"
        description="补齐路由、视图、业务组件、数据层和工具函数，让这个项目更像一个能持续迭代的正式前端仓库。"
      />
      <RouterView />
    </div>
  </div>
</template>
