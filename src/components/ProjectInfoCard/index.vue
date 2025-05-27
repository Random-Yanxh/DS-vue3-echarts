<template>
  <div class="project-info-card component-container">
    <h3>智慧微电网监控与分析平台</h3>
    <div class="info-grid">
      <div class="info-item">
        <strong>项目地点:</strong> <span>智慧园区A栋</span>
      </div>
      <div class="info-item">
        <strong>投运日期:</strong> <span>2024年01月</span>
      </div>
      <div class="info-item full-width">
        <strong>核心功能:</strong> <span>实现对园区内光伏发电、储能系统、多元负荷的智能监控、优化调度与数据分析，旨在提高能源利用效率，降低运营成本，增强供电可靠性。</span>
      </div>
      <div class="info-item">
        <strong>光伏装机:</strong> <span class="value">250 kWp</span>
      </div>
      <div class="info-item">
        <strong>储能配置:</strong> <span class="value">500 kWh / 250 kW</span>
      </div>
      <div class="info-item">
        <strong>负荷类型:</strong> <span>办公楼宇、充电站、数据中心</span>
      </div>
      <div class="info-item">
        <strong>并网模式:</strong> <span>可并可离</span>
      </div>
    </div>
    <!-- 可以添加一个小的示意图或logo占位符 -->
    <!-- <img src="/path/to/your/microgrid-diagram-thumbnail.png" alt="微电网示意图" class="project-thumbnail"/> -->
  </div>
</template>

<script setup>
// 未来可能的状态或方法
</script>

<style scoped>
.project-info-card {
  padding: 15px; /* 统一 padding */
  background-color: rgba(10, 25, 47, 0.8); /* 统一背景色 */
  border-radius: 5px; /* 统一圆角 */
  color: #e6f7ff;
  border: 1px solid #2a3a5a;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.3); /* 统一阴影 */
  height: 100%; /* 尝试让卡片填满其在网格布局中的单元格 */
  display: flex;
  flex-direction: column;
}
.project-info-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #64ffda;
  text-align: center;
  font-size: 1.4em; /* 调整标题大小 */
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 响应式列 */
  gap: 12px; /* 网格间距 */
  flex-grow: 1;
}
.info-item {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9em;
}
.info-item strong {
  color: #8892b0; /* 标签颜色 */
  margin-right: 8px;
}
.info-item span {
  color: #ccd6f6; /* 内容颜色 */
}
.info-item .value {
  color: #64ffda; /* 数值高亮 */
  font-weight: bold;
}
.info-item.full-width {
  grid-column: 1 / -1; /* 占满整行 */
}
/* .project-thumbnail { margin-top: auto; max-width: 100%; height: auto; align-self: center; } */
/* .component-container 已被合并到 .project-info-card */
</style>