<script setup lang="ts">
import ExperienceTimeline from '../components/ExperienceTimeline.vue'
import { experiences } from '../data/experiences'
</script>

<template>
  <div class="page-sections">
    <header class="content-section stack">
      <h1>關於 Fang</h1>
      <p>我是 Fang，一位平面設計師，目前正在學習前端網頁設計。</p>
    </header>
    <section class="content-section stack" aria-labelledby="about-background">
      <h2 id="about-background">個人介紹</h2>
      <div class="placeholder-panel"><p class="muted">完整自我介紹與照片待提供。</p></div>
    </section>
    <section class="content-section stack" aria-labelledby="about-experience">
      <h2 id="about-experience">經歷 Experience</h2>
      <ExperienceTimeline :entries="experiences" />
    </section>
    <section class="content-section stack" aria-labelledby="about-contact">
      <h2 id="about-contact">聯絡方式</h2>
      <div class="placeholder-panel"><p class="muted">公開聯絡方式與社群連結待確認。</p></div>
    </section>
  </div>
</template>
