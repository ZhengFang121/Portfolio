<script setup lang="ts">
import { computed } from 'vue'
import { projects } from '../data/projects'
import ProjectDetail from '../components/ProjectDetail.vue'
import NotFoundPage from './NotFoundPage.vue'
const props = defineProps<{ slug: string }>()
const project = computed(() => projects.find((item) => item.slug === props.slug))
</script>
<template><ProjectDetail v-if="project" :project="project" /><NotFoundPage v-else /></template>
