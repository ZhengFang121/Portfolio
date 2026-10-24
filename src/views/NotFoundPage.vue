<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
</script>
<template>
  <div class="page-sections">
    <section class="content-section stack" aria-labelledby="not-found-title">
      <p class="eyebrow">404</p>
      <h1 id="not-found-title">找不到這個頁面</h1>
      <p class="muted body-copy">這個網址沒有對應的頁面，你可以回到首頁繼續瀏覽作品。</p>
      <RouterLink v-slot="{ href, navigate }" to="/" custom>
        <Button as="a" :href="href" label="返回首頁" class="w-fit" @click="navigate" />
      </RouterLink>
    </section>
  </div>
</template>
