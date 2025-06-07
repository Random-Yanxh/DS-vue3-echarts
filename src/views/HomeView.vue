<script setup>
import { reactive, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import EPie from '@/components/EPie/index.vue'
import Gridmap from '@/components/Gridmap/index.vue'
import Control from '@/components/Control/index.vue'
import Indicators from '@/components/Indicators/index.vue'
import Aichat from '@/components/Aichat/index.vue'
import Graph from '@/components/Graph/index.vue'

// 导入新的四个组件
import ProjectInfoCard from '../components/ProjectInfoCard/index.vue'
import KeyPerformanceIndicators from '../components/KeyPerformanceIndicators/index.vue'
import BatteryDetailedStatus from '../components/BatteryDetailedStatus/index.vue'
import EconomicBenefitAnalysis from '../components/EconomicBenefitAnalysis/index.vue'


const fullScreenStatus = reactive({
  graph: false,
  indicators: false,
  gridmap: false,
  control: false,
  epie: false,
  aichat: false,
})
const graph = ref(null)
const gridmap = ref(null)
const epie = ref(null)
const indicators = ref(null)
const aichat = ref(null)
const control = ref(null)

const changeSize = async (value) => {
  fullScreenStatus[value] = !fullScreenStatus[value]
  await nextTick()
  // Ensure the ref is valid before calling screenAdapter
  if (eval(value) && eval(value).value && typeof eval(value).value.screenAdapter === 'function') {
    eval(value).value.screenAdapter()
  }
}

// 全屏滚动相关 ref 和函数
const fullpageContainer = ref(null);
const pageSections = ref([]);
const currentPageIndex = ref(0);
const isScrolling = ref(false);
const scrollTimeout = ref(null);

onMounted(() => {
  if (fullpageContainer.value) {
    pageSections.value = Array.from(fullpageContainer.value.querySelectorAll('.page-section'));
  }
  scrollToPage(0); // 确保初始定位在第一页
});

onBeforeUnmount(() => {
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value);
  }
});

const handleWheelScroll = (event) => {
  event.preventDefault();
  if (isScrolling.value) return;

  isScrolling.value = true;
  const delta = event.deltaY > 0 ? 1 : -1; // 1 for down, -1 for up

  if (delta > 0 && currentPageIndex.value < pageSections.value.length - 1) {
    currentPageIndex.value++;
  } else if (delta < 0 && currentPageIndex.value > 0) {
    currentPageIndex.value--;
  }
  scrollToPage(currentPageIndex.value);

  if (scrollTimeout.value) clearTimeout(scrollTimeout.value);
  scrollTimeout.value = setTimeout(() => {
    isScrolling.value = false;
  }, 800); // 滚动动画的近似时间，防止过快切换
};

const scrollToPage = (pageIndex) => {
  if (pageSections.value[pageIndex]) {
    pageSections.value[pageIndex].scrollIntoView({ behavior: 'smooth' });
  }
};

</script>

<template>
  <div class="fullpage-container" @wheel="handleWheelScroll" ref="fullpageContainer">
    <section id="page1" class="page-section">
      <div class="original-layout-wrapper">
        <div class="header">基于源网荷储一体化新型电力系统的硬件在环仿真实验平台</div>
        <div class="graph" :class="fullScreenStatus.graph ? 'fullscreen' : ''">
          <Graph ref="graph"></Graph>
          <span @click="changeSize('graph')" class="iconfont enlargement"
            :class="fullScreenStatus.graph ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="gridmap" :class="fullScreenStatus.gridmap ? 'fullscreen' : ''">
          <Gridmap ref="gridmap"></Gridmap>
          <span @click="changeSize('gridmap')" class="iconfont enlargement"
            :class="fullScreenStatus.gridmap ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="epie" :class="fullScreenStatus.epie ? 'fullscreen' : ''">
          <EPie ref="epie"></EPie>
          <span @click="changeSize('epie')" class="iconfont enlargement"
            :class="fullScreenStatus.epie ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="indicators" :class="fullScreenStatus.indicators ? 'fullscreen' : ''">
          <Indicators ref="indicators"></Indicators>
          <span @click="changeSize('indicators')" class="iconfont enlargement"
            :class="fullScreenStatus.indicators ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="control_container" :class="fullScreenStatus.control ? 'fullscreen' : ''">
          <Control ref="control"></Control>
          <span @click="changeSize('control')" class="iconfont enlargement"
            :class="fullScreenStatus.control ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="aichat" :class="fullScreenStatus.aichat ? 'fullscreen' : ''">
          <Aichat ref="aichat"></Aichat>
          <span @click="changeSize('aichat')" class="iconfont enlargement"
            :class="fullScreenStatus.aichat ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
      </div>
    </section>
    <section id="page2" class="page-section">
      <div class="page2-grid-layout">
        <ProjectInfoCard style="grid-area: projInfo;" />
        <KeyPerformanceIndicators style="grid-area: kpi;" />
        <BatteryDetailedStatus style="grid-area: battery;" />
        <EconomicBenefitAnalysis style="grid-area: econ;" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  z-index: 10000; /* Increased z-index for fullscreen components */
}

.fullpage-container {
  width: 100%;
  height: 100vh;
  overflow: hidden; /* 关键：隐藏默认滚动条 */
}

.page-section {
  width: 100%;
  height: 100vh; /* 每个页面占据整个视口高度 */
  display: flex; /* 使用flex布局方便内容对齐 */
  flex-direction: column;
  /* align-items: center; */ /* 根据内容需要调整 */
  /* justify-content: center; */ /* 根据内容需要调整 */
  /* background-color: #f0f0f0; */ /* 示例 */
}

#page1 {
  /* background-color: #161522; */ /* 保持原有背景色 */
  /* For page1, we want the original layout wrapper to take full space */
  justify-content: center;
  align-items: center;
}

#page2 {
  /* background-color: #1a1a2e; */ /* 第二页的示例背景色 */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px; /* Add some padding for the new components */
  background-image: url('@/assets/background_16_9.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.original-layout-wrapper {
  width: 100%;
  height: 100%;
  padding: 0 20px; /* Maintain original padding */
  background-color: transparent;
  background-image: url('@/assets/background_16_9.png');
  background-repeat: no-repeat;
  background-size: cover;
  display: grid;
  grid-template-rows: 8% 50% 10% 25%;
  grid-template-columns: 28% 42% 28%;
  justify-content: space-between;
  align-content: space-around;
  grid-template-areas:
    "header header header"
    "graph   gridmap    epie"
    "indicators  gridmap   aichat"
    "indicators  control  aichat"
  ;
  box-sizing: border-box; /* Ensure padding doesn't break layout */
}

.original-layout-wrapper>div { /* Styles for direct children of original-layout-wrapper */
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.page2-grid-layout {
  display: grid;
  width: 95%; /* Slightly smaller than the #page2 content area to create outer margins */
  height: 95%; /* Slightly smaller than the #page2 content area */
  grid-template-columns: repeat(2, calc(50% - 10px)); /* Two columns with a gap, relative to this new smaller container */
  grid-template-rows: repeat(2, calc(50% - 10px));    /* Two rows with a gap, relative to this new smaller container */
  grid-template-areas:
    "projInfo battery"
    "kpi      econ";
  gap: 20px; /* Uniform spacing between modules */
  /* justify-content: space-between; /* Removed as calc should handle precise sizing within the new container size */
  /* align-content: space-between;   /* Removed for the same reason */
  /* background-color: rgba(10, 25, 47, 0.3); /* Optional: subtle background for the grid area itself */
  border-radius: 10px; /* Match styling of other component containers if desired */
  box-sizing: border-box;
}

.page2-grid-layout > * { /* Style for direct children (the components) */
  width: 100%; /* Components should fill their assigned grid area */
  height: 100%;
  overflow: hidden; /* Prevent content within components from overflowing the component box */
  border-radius: 10px; /* Consistent rounded corners for each module */
  /* background-color: rgba(20, 35, 57, 0.7); /* Example background for individual modules, adjust as needed */
  /* padding: 15px; /* Add padding inside each module if needed, or let components handle it */
  box-sizing: border-box;
  /* display: flex; flex-direction: column; /* Remove if components manage their own layout */
}

.header {
  grid-area: header;
  background-color: transparent;
  color: white;
  font-size: 22px;
  text-align: center;
  line-height: 80px; /* Adjusted to match original if it was based on percentage */
}

.graph {
  grid-area: graph;
}

.gridmap {
  grid-area: gridmap;
}

.epie {
  grid-area: epie;
}

.indicators {
  grid-area: indicators;
}

.control_container {
  grid-area: control;
}

.aichat {
  grid-area: aichat;
}

.enlargement {
  position: absolute;
  right: 10px;
  top: 10px;
  color: white;
  cursor: pointer;
  z-index: 10; /* Ensure enlargement icon is above component content */
}
</style>
