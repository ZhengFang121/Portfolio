<template>
  <footer class="site-footer">
    <p>© 2026 Fang’s Portfolio</p>
  </footer>
</template>

<style scoped>
/* 保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  .site-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    min-block-size: 4.375rem;
    padding: var(--space-3) var(--layout-gutter);
    border-radius: var(--content-section-radius);
    background: var(--palette-blue);
    color: var(--palette-red);
    font-size: var(--font-size-md);
    text-align: center;
  }
}
</style>
