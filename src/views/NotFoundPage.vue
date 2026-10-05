<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
</script>
<template>
  <div class="stack intro">
    <p class="eyebrow">404</p>
    <h1>找不到這個頁面</h1>
    <p class="muted">這個網址沒有對應的頁面，你可以回到首頁繼續瀏覽作品。</p>
    <RouterLink v-slot="{ href, navigate }" to="/" custom>
      <Button as="a" :href="href" label="返回首頁" class="w-fit" @click="navigate" />
    </RouterLink>
  </div>
</template>
