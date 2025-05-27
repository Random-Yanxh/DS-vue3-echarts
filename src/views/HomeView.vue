<script setup>
import { reactive, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Hot from '@/components/Hot/index.vue'
import Map from '@/components/Map/index.vue'
import Rank from '@/components/Rank/index.vue'
import Seller from '@/components/Seller/index.vue'
import Stock from '@/components/Stock/index.vue'
import Trend from '@/components/Trend/index.vue'

// 导入新的四个组件
import ProjectInfoCard from '../components/ProjectInfoCard.vue'
import KeyPerformanceIndicators from '../components/KeyPerformanceIndicators.vue'
import BatteryDetailedStatus from '../components/BatteryDetailedStatus.vue'
import EconomicBenefitAnalysis from '../components/EconomicBenefitAnalysis.vue'


const fullScreenStatus = reactive({
  trend: false,
  seller: false,
  map: false,
  rank: false,
  hot: false,
  stock: false,
})
const trend = ref(null)
const map = ref(null)
const hot = ref(null)
const seller = ref(null)
const stock = ref(null)
const rank = ref(null)

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
        <div class="header">绿氢微电网平台实时仿真监控系统</div>
        <div class="trend" :class="fullScreenStatus.trend ? 'fullscreen' : ''">
          <Trend ref="trend"></Trend>
          <span @click="changeSize('trend')" class="iconfont enlargement"
            :class="fullScreenStatus.trend ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="map" :class="fullScreenStatus.map ? 'fullscreen' : ''">
          <Map ref="map"></Map>
          <span @click="changeSize('map')" class="iconfont enlargement"
            :class="fullScreenStatus.map ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="hot" :class="fullScreenStatus.hot ? 'fullscreen' : ''">
          <Hot ref="hot"></Hot>
          <span @click="changeSize('hot')" class="iconfont enlargement"
            :class="fullScreenStatus.hot ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="seller" :class="fullScreenStatus.seller ? 'fullscreen' : ''">
          <Seller ref="seller"></Seller>
          <span @click="changeSize('seller')" class="iconfont enlargement"
            :class="fullScreenStatus.seller ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="rank" :class="fullScreenStatus.rank ? 'fullscreen' : ''">
          <Rank ref="rank"></Rank>
          <span @click="changeSize('rank')" class="iconfont enlargement"
            :class="fullScreenStatus.rank ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
        <div class="stock" :class="fullScreenStatus.stock ? 'fullscreen' : ''">
          <Stock ref="stock"></Stock>
          <span @click="changeSize('stock')" class="iconfont enlargement"
            :class="fullScreenStatus.stock ? 'icon-compress-alt' : 'icon-expand-alt'"></span>
        </div>
      </div>
    </section>
    <section id="page2" class="page-section">
      <div class="page2-grid-layout">
        <ProjectInfoCard />
        <KeyPerformanceIndicators />
        <BatteryDetailedStatus />
        <EconomicBenefitAnalysis />
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
    "trend   map    hot"
    "seller  map   stock"
    "seller  rank  stock"
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
  gap: 20px;
  width: 90%; /* Adjust width as needed */
  max-width: 1200px; /* Max width for larger screens */
  padding: 20px;
  background-color: rgba(0,0,0,0.1); /* Optional: slight background for the grid area */
  border-radius: 10px;
}


.header {
  grid-area: header;
  background-color: transparent;
  color: white;
  font-size: 22px;
  text-align: center;
  line-height: 80px; /* Adjusted to match original if it was based on percentage */
}

.trend {
  grid-area: trend;
}

.map {
  grid-area: map;
}

.hot {
  grid-area: hot;
}

.seller {
  grid-area: seller;
}

.rank {
  grid-area: rank;
}

.stock {
  grid-area: stock;
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
