<template>
  <div class="kpi-container component-container">
    <h3>关键性能指标 (KPIs)</h3>
    <div class="kpi-grid">
      <div class="kpi-item">
        <h4>新能源渗透率</h4>
        <p class="kpi-value">{{ renewableEnergyPenetration.toFixed(1) }} %</p>
      </div>
      <div class="kpi-item">
        <h4>自给自足率</h4>
        <p class="kpi-value">{{ selfSufficiencyRate.toFixed(1) }} %</p>
      </div>
      <!-- 可以根据需要添加更多KPI项 -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const renewableEnergyPenetration = ref(0);
const selfSufficiencyRate = ref(0);

onMounted(() => {
  // 模拟API调用或数据更新
  setTimeout(() => {
    renewableEnergyPenetration.value = 78.5; // 示例值
    selfSufficiencyRate.value = 62.3;    // 示例值
  }, 500); // 模拟延迟
});
</script>

<style scoped>
/* 示例样式调整 */
.kpi-container {
  padding: 15px; /* 统一 padding */
  height: 100%; /* 尝试填满单元格 */
  display: flex;
  flex-direction: column;
  border: 1px solid #2a3a5a; /* 统一边框 */
  border-radius: 5px; /* 统一圆角 */
  background-color: rgba(10, 25, 47, 0.8); /* 统一背景色 */
  color: #e6f7ff; /* 统一文字颜色 */
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.3); /* 统一阴影 */
}
.kpi-container h3 {
  margin-top: 0;
  margin-bottom: 20px; /* 增加标题和内容间的间距 */
  color: #64ffda;
  text-align: center;
  font-size: 1.4em;
}
.kpi-grid {
  display: flex;
  justify-content: space-around; /* 或 space-evenly */
  align-items: center; /* 垂直居中对齐KPI项 */
  gap: 20px;
  flex-grow: 1; /* 让网格填满剩余空间 */
}
.kpi-item {
  text-align: center;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 6px;
  min-width: 150px; /* 给每个KPI项一个最小宽度 */
}
.kpi-item h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.1em; /* 调整KPI名称字体大小 */
  color: #a8b2d1;
  font-weight: 500;
}
.kpi-value {
  font-size: 2.2em; /* 增大KPI数值字体 */
  font-weight: bold;
  color: #64ffda;
  margin-top: 0;
  margin-bottom: 0;
}
/* .component-container 已被合并到 .kpi-container */
</style>