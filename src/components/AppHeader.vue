<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
<template>
  <header class="site-header">
    <div class="container header-content">
      <RouterLink class="brand-link" to="/">ZhengFang's Portfolio</RouterLink>
      <nav class="site-nav" aria-label="主要導覽">
        <RouterLink to="/about">關於 Fang</RouterLink>
        <RouterLink to="/works">主要作品</RouterLink>
        <RouterLink to="/graphic-works">其他平面作品</RouterLink>
      </nav>
    </div>
  </header>
</template>
