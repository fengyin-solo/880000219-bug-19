import { computed } from 'vue'

import {
  restorationBatches,
  restorationMetrics,
  restorationTasks,
} from '../data/restorationData'

export function useRestorationOverview() {
  const batchCount = computed(() => restorationBatches.length)
  const highRiskCount = computed(
    () => restorationTasks.filter((item) => item.risk === 'high').length,
  )
  const environmentCount = computed(() => restorationMetrics.length)
  const ownerCount = computed(() => new Set(restorationTasks.map((item) => item.owner)).size)

  return {
    batchCount,
    highRiskCount,
    environmentCount,
    ownerCount,
  }
}
