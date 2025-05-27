<template>
  <div class="battery-status-container component-container">
    <h3>电池详细状态</h3>
    <div class="status-grid">
      <div class="status-item">
        <h4>SOC (荷电状态)</h4>
        <p class="status-value primary">{{ soc.toFixed(1) }} %</p>
      </div>
      <div class="status-item">
        <h4>实时功率</h4>
        <p :class="['status-value', power > 0 ? 'charging' : 'discharging']">{{ power.toFixed(1) }} kW</p>
        <span class="status-label">{{ power > 0 ? '(充电)' : '(放电)' }}</span>
      </div>
      <div class="status-item">
        <h4>SOH (健康状态)</h4>
        <p class="status-value">{{ soh.toFixed(1) }} %</p>
      </div>
      <div class="status-item">
        <h4>电压</h4>
        <p class="status-value">{{ voltage.toFixed(1) }} V</p>
      </div>
      <div class="status-item">
        <h4>电流</h4>
        <p class="status-value">{{ current.toFixed(1) }} A</p>
      </div>
      <div class="status-item">
        <h4>温度</h4>
        <p class="status-value">{{ temperature.toFixed(1) }} °C</p>
      </div>
    </div>
    <div class="chart-placeholder">
      <p>(此处未来将有电池充放电功率/SOC历史曲线图)</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const soc = ref(0);
const power = ref(0); // 正为充电，负为放电
const soh = ref(0);
const voltage = ref(0);
const current = ref(0);
const temperature = ref(0);

onMounted(() => {
  // 模拟API调用或数据更新
  setTimeout(() => {
    soc.value = 85.2;
    power.value = -15.5; // 正在放电
    soh.value = 98.5;
    voltage.value = 380.5;
    current.value = -40.7; // 正在放电
    temperature.value = 28.3;
  }, 700); // 模拟延迟
});
</script>

<style scoped>
.battery-status-container {
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
.battery-status-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #64ffda;
  text-align: center;
  font-size: 1.4em;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); /* 响应式列 */
  gap: 15px; /* 网格项之间的间距 */
  margin-bottom: 20px;
}
.status-item {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 4px;
  text-align: center;
}
.status-item h4 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 0.95em;
  color: #a8b2d1;
  font-weight: 500;
}
.status-value {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 3px;
}
.status-value.primary { color: #64ffda; }
.status-value.charging { color: #4CAF50; } /* 充电绿色 */
.status-value.discharging { color: #FF9800; } /* 放电橙色 */
.status-label {
  font-size: 0.8em;
  color: #8892b0;
}
.chart-placeholder {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #2a3a5a;
  border-radius: 4px;
  color: #506680;
  min-height: 150px; /* 给图表占位一个最小高度 */
}
/* .component-container 已被合并到 .battery-status-container */
</style>