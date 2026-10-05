<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ProjectGrid from '../components/ProjectGrid.vue'
</script>
<template>
  <div class="section-stack">
    <section class="stack intro" aria-labelledby="home-title">
      <p class="eyebrow">Fang 的作品集</p>
      <h1 id="home-title">ZhengFang's Portfolio</h1>
      <p>我是 Fang，一位平面設計師，目前正在學習前端網頁設計。</p>
      <RouterLink class="text-link" to="/about">認識 Fang</RouterLink>
    </section>
    <section class="stack" aria-labelledby="selected-works">
      <h2 id="selected-works">主要作品</h2>
      <p class="muted">六個作品的介紹與圖片整理中。</p>
      <ProjectGrid />
    </section>
    <RouterLink class="text-link" to="/graphic-works">查看其他平面作品</RouterLink>
  </div>
</template>
