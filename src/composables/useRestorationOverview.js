import { computed } from 'vue'

import { restorationBatches, restorationTasks } from '../data/restorationData'
import { useEnvironmentMonitor } from './useEnvironmentMonitor'

export function useRestorationOverview() {
  const { metricCount } = useEnvironmentMonitor()

  const batchCount = computed(() => restorationBatches.length)
  const highRiskCount = computed(
    () => restorationTasks.filter((item) => item.risk === 'high').length,
  )
  const environmentCount = computed(() => metricCount.value)
  const ownerCount = computed(() => new Set(restorationTasks.map((item) => item.owner)).size)

  return {
    batchCount,
    highRiskCount,
    environmentCount,
    ownerCount,
  }
}
