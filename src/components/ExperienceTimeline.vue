<script setup lang="ts">
import Timeline from 'primevue/timeline'
import type { ExperienceYear } from '../data/experiences'

defineProps<{ entries: ExperienceYear[] }>()
</script>

<template>
  <Timeline
    :value="entries"
    data-key="year"
    align="left"
    layout="vertical"
    class="experience-timeline"
    aria-label="依年份由新到舊排列的經歷"
  >
    <template #opposite="{ item }: { item: ExperienceYear }">
      <time class="experience-year" :datetime="String(item.year)">{{ item.year }}</time>
    </template>
    <template #marker>
      <span class="experience-marker" aria-hidden="true" />
    </template>
    <template #content="{ item }: { item: ExperienceYear }">
      <ul class="experience-items">
        <li v-for="experience in item.items" :key="experience.text" class="body-copy">
          <strong v-if="experience.type">{{ experience.text }}</strong>
          <template v-else>{{ experience.text }}</template>
        </li>
      </ul>
    </template>
  </Timeline>
</template>

<style scoped>
@layer components {
  .experience-timeline {
    isolation: isolate;
    max-inline-size: var(--layout-text-width);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    background: var(--palette-red);
    font-size: var(--font-size-md);
    line-height: var(--line-height-body);
    letter-spacing: var(--letter-spacing-body);
  }

  .experience-timeline :deep(.p-timeline-event) {
    min-block-size: 0;
  }

  .experience-timeline :deep(.p-timeline-event-opposite) {
    flex: 0 0 calc(4ch + var(--space-6));
    padding: var(--space-3) var(--space-3) 0;
    text-align: end;
  }

  .experience-year {
    color: var(--palette-yellow);
    font-weight: var(--font-weight-semibold);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .experience-timeline :deep(.p-timeline-event-separator) {
    flex: 0 0 auto;
    padding-block-start: var(--space-3);
    padding-inline-end: var(--space-3);
  }

  .experience-marker {
    display: block;
    flex-shrink: 0;
    inline-size: var(--space-3);
    block-size: var(--space-3);
    margin-block-start: calc((1em * var(--line-height-body) - var(--space-3)) / 2);
    border-radius: var(--radius-full);
    background: var(--palette-yellow);
  }

  /* 補齊下一個圓點上方的距離，年份間的留白仍由內容自然撐開。 */
  .experience-timeline :deep(.p-timeline-event-connector) {
    position: relative;
    z-index: 1;
    inline-size: 1px;
    margin-block-end: calc(
      -1 * (var(--space-3) + (1em * var(--line-height-body) - var(--space-3)) / 2)
    );
    background: var(--palette-yellow);
  }

  .experience-timeline :deep(.p-timeline-event-content) {
    flex: 1;
    min-inline-size: 0;
    padding: var(--space-3) 0 var(--space-8) var(--space-6);
    text-align: start;
  }

  .experience-timeline :deep(.p-timeline-event:last-child .p-timeline-event-content) {
    padding-block-end: var(--space-3);
  }

  .experience-items {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    color: var(--palette-blue);
    list-style: none;
    overflow-wrap: anywhere;
  }

  .experience-items strong {
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 899px) {
    .experience-timeline :deep(.p-timeline-event-content) {
      padding-inline-start: var(--space-4);
    }
  }

  @media (max-width: 480px) {
    .experience-timeline :deep(.p-timeline-event-opposite) {
      flex-basis: calc(4ch + var(--space-4));
      padding-inline: var(--space-2);
    }

    .experience-timeline :deep(.p-timeline-event-separator) {
      padding-inline-end: var(--space-2);
    }

    .experience-timeline :deep(.p-timeline-event-content) {
      padding-inline-start: var(--space-3);
    }
  }
}
</style>
