<script setup>
import CompareSlot from './CompareSlot.vue'
import CompareDiff from './CompareDiff.vue'
</script>

<template>
  <div class="cmp-layout">
    <CompareSlot
      slot-key="a"
      label-key="cmp_a"
    />
    <CompareDiff />
    <CompareSlot
      slot-key="b"
      label-key="cmp_b"
    />
  </div>
</template>
