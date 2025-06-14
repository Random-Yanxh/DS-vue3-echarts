<script setup>
// No script logic needed for now, unless we add dynamic content later
</script>

<template>
  <div class="panel_container">
    <h3 class="panel_title">▎关键指标仪表盘</h3>
    <div class="panel_content">
      <!-- Content for the panel will go here -->
      <p>仪表盘内容正在建设中...</p>
    </div>
  </div>
</template>

<style scoped>
.panel_container {
  width: 100%;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
  background-color: rgba(10, 25, 47, 0.75); /* Match Indicators */
  color: #e6f7ff; /* Match Indicators */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Match Indicators */
  display: flex;
  flex-direction: column;
  border-radius: 10px; /* Consistent with other components in HomeView */
  overflow: hidden; /* Consistent with other components in HomeView */
}

.panel_title {
  font-size: clamp(16px, 4vw, 20px); /* Match Indicators */
  color: #64ffda; /* Match Indicators */
  margin-bottom: 15px; /* Match Indicators */
  text-shadow: 0 0 5px #64ffda; /* Match Indicators */
  align-self: flex-start; /* Match Indicators */
  padding-left: 5px; /* Match Indicators */
  flex-shrink: 0; /* Prevent title from shrinking */
}

.panel_content {
  width: 100%;
  flex-grow: 1; /* Fill remaining space */
  overflow-y: auto; /* Allow scrolling if content exceeds height */
  /* Basic styling for placeholder text */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: clamp(14px, 3vw, 16px);
  color: #a8b2d1; /* Softer color for placeholder */
}
</style>