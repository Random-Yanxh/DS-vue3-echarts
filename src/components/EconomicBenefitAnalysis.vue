<template>
  <div class="economic-analysis-container component-container">
    <h3>经济效益分析</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <h4>今日运行成本</h4>
        <p class="summary-value cost">{{ costToday.toFixed(2) }} 元</p>
      </div>
      <div class="summary-item">
        <h4>今日节省成本</h4>
        <p class="summary-value savings">{{ savingsToday.toFixed(2) }} 元</p>
      </div>
    </div>
    <div class="charts-area">
      <div class="chart-placeholder">
        <p>(此处未来将有成本构成饼图)</p>
      </div>
      <div class="chart-placeholder">
        <p>(此处未来将有收益来源饼图)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const costToday = ref(0);
const savingsToday = ref(0);
// 模拟成本构成和收益来源的数据，为将来的饼图做准备
const costComposition = ref([
  { value: 0, name: '购电成本' },
  { value: 0, name: '运维成本' },
  { value: 0, name: '其他成本' }
]);
const revenueSource = ref([
  { value: 0, name: '售电收益' },
  { value: 0, name: '需求响应' }
]);

onMounted(() => {
  // 模拟API调用或数据更新
  setTimeout(() => {
    costToday.value = 125.50;
    savingsToday.value = 75.20;
    costComposition.value = [
      { value: 100.30, name: '购电成本' },
      { value: 15.20, name: '运维成本' },
      { value: 10.00, name: '其他成本' }
    ];
    revenueSource.value = [
      { value: 50.00, name: '售电收益' },
      { value: 25.20, name: '需求响应' }
    ];
  }, 900); // 模拟延迟
});
</script>

<style scoped>
/* 示例样式调整 */
.economic-analysis-container {
  padding: 15px; /* 统一 padding */
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #2a3a5a; /* 统一边框 */
  border-radius: 5px; /* 统一圆角 */
  background-color: rgba(10, 25, 47, 0.8); /* 统一背景色 */
  color: #e6f7ff; /* 统一文字颜色 */
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.3); /* 统一阴影 */
}
.economic-analysis-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #64ffda;
  text-align: center;
  font-size: 1.4em;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}
.summary-item {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 4px;
  text-align: center;
}
.summary-item h4 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 0.95em;
  color: #a8b2d1;
  font-weight: 500;
}
.summary-value {
  font-size: 1.6em; /* 调整数值大小 */
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 0;
}
.summary-value.cost { color: #FF6347; } /* 成本红色 */
.summary-value.savings { color: #4CAF50; } /* 节省绿色 */

.charts-area {
  display: flex;
  gap: 20px; /* 图表占位符之间的间距 */
  flex-grow: 1;
}
.chart-placeholder {
  flex: 1; /* 每个图表占位符占据可用空间的一半 */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #2a3a5a;
  border-radius: 4px;
  color: #506680;
  min-height: 120px; /* 给图表占位一个最小高度 */
}
/* .component-container 已被合并到 .economic-analysis-container */
</style>