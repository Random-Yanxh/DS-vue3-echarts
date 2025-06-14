<script setup>
import { ref, inject, onMounted, onBeforeUnmount, watch } from 'vue';
import { useModeStore } from '@/stores/modeStore';

const echarts = inject('echarts');
const hydrogon_chart_element = ref(null);
let chartInstance = null;
let resizeObserver = null;

const modeStore = useModeStore();
const TARGET_TIME_STEP = 1e-3; // Target time step for downsampling

const initChart = () => {
  if (hydrogon_chart_element.value && !chartInstance) {
    chartInstance = echarts.init(hydrogon_chart_element.value, 'chalk');
    console.log("HydrogonChart: Chart initialized.");
    // setupLegendListener(); // Removed
  }
};

const chartTitle = ref('氢系统关键参数');
const titleFontSize = ref(0);
const allSeriesData = ref({}); // Stores { fileName: downsampledDataArray }

// Configuration for the hydrogon chart series - all initially visible
const hydrogonSeriesConfig = [
  { name: 'H2生成速率', fileName: 'PELLog_H2_rate_mol_s', unit: 'mol/s', color: '#67C23A', yAxisIndex: 0, initiallyVisible: true },
  { name: 'H2输入参数', fileName: 'HydrogenTankLog_H2_in_Velec', unit: 'Value', color: '#409EFF', yAxisIndex: 1, initiallyVisible: true }, 
  { name: 'H2输出流量', fileName: 'HydrogenTankLog_H2_out_L_min', unit: 'L/min', color: '#E6A23C', yAxisIndex: 0, initiallyVisible: true }, 
  { name: '储氢罐SOH', fileName: 'HydrogenTankLog_SOH', unit: '%', color: '#F56C6C', yAxisIndex: 2, initiallyVisible: true },
];

function downsampleData(rawData, targetStep) {
  if (!rawData || rawData.length === 0) return [];
  const downsampled = [];
  let lastPushedTime = -Infinity;
  if (rawData.length > 0) {
    downsampled.push(rawData[0]);
    lastPushedTime = rawData[0].time;
  }
  for (let i = 1; i < rawData.length; i++) {
    const point = rawData[i];
    if (point.time >= lastPushedTime + targetStep) {
      if (i > 0 && rawData[i-1].time > lastPushedTime && rawData[i-1].time < point.time && downsampled[downsampled.length-1].time !== rawData[i-1].time) {
         if(downsampled[downsampled.length-1].time < rawData[i-1].time) {
            downsampled.push(rawData[i-1]);
         }
      }
      downsampled.push(point);
      lastPushedTime = point.time;
    }
  }
  if (rawData.length > 0) {
    const lastRawPoint = rawData[rawData.length - 1];
    if (downsampled.length === 0 || downsampled[downsampled.length - 1].time < lastRawPoint.time) {
      downsampled.push(lastRawPoint);
    } else if (downsampled.length > 0 && downsampled[downsampled.length - 1].time === lastRawPoint.time && downsampled[downsampled.length - 1].value !== lastRawPoint.value){
      downsampled[downsampled.length - 1] = lastRawPoint;
    }
  }
  return downsampled;
}

const fetchAndProcessSeriesData = async (seriesConf) => {
  if (!modeStore.selectedModeFolderPath) return [];
  const filePath = `${modeStore.selectedModeFolderPath}${seriesConf.fileName}.json`;
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(`HydrogonChart: HTTP error! status: ${response.status} for ${filePath}`);
      return [];
    }
    let jsonDataArray = await response.json();
    if (!Array.isArray(jsonDataArray)) {
      console.error(`HydrogonChart: Data from ${filePath} is not an array.`, jsonDataArray);
      return [];
    }
    jsonDataArray = jsonDataArray.map(item => ({
      time: Number(item.time),
      value: Number(item.value)
    })).filter(item => !isNaN(item.time) && !isNaN(item.value));
    
    return downsampleData(jsonDataArray, TARGET_TIME_STEP);
  } catch (error) {
    console.error(`HydrogonChart: Error fetching or parsing data from ${filePath}:`, error);
    return [];
  }
};

const fetchDataForHydrogon = async () => {
  if (!modeStore.selectedModeFolderPath) {
    console.warn("HydrogonChart: Mode folder path is missing. Clearing data.");
    allSeriesData.value = {};
    if (chartInstance) updateChart();
    return;
  }
  
  const newSeriesData = {};
  const loadPromises = hydrogonSeriesConfig.map(async (seriesConf) => {
      const processedData = await fetchAndProcessSeriesData(seriesConf);
      newSeriesData[seriesConf.fileName] = processedData;
    });

  await Promise.all(loadPromises);
  allSeriesData.value = newSeriesData;
  if (chartInstance) updateChart();
};

const updateChart = () => {
  if (!chartInstance) return;

  const series = hydrogonSeriesConfig.map(seriesConf => {
    const dataForSeries = allSeriesData.value[seriesConf.fileName] || [];
    return {
      name: seriesConf.name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      itemStyle: { color: seriesConf.color },
      yAxisIndex: seriesConf.yAxisIndex,
      data: dataForSeries.map(item => [item.time, item.value]),
      emphasis: { focus: 'series' },
    };
  });

  const legendSelected = {};
  hydrogonSeriesConfig.forEach(conf => {
    legendSelected[conf.name] = true; // All true initially
  });

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
      formatter: (params) => {
        if (!params || params.length === 0 || params[0].axisValueLabel == null) return '';
        const timeValue = parseFloat(params[0].axisValueLabel);
        let tooltipHtml = `${timeValue.toFixed(TARGET_TIME_STEP.toString().split('.')[1]?.length || 2)} s<br/>`;
        params.forEach(param => {
          const seriesConf = hydrogonSeriesConfig.find(s => s.name === param.seriesName);
          const unit = seriesConf ? seriesConf.unit : '';
          const value = (Array.isArray(param.value) && param.value.length > 1) ? parseFloat(param.value[1]).toFixed(3) : 'N/A';
          tooltipHtml += `${param.marker} ${param.seriesName}: ${value} ${unit}<br/>`;
        });
        return tooltipHtml;
      }
    },
    legend: {
      data: hydrogonSeriesConfig.map(s => s.name),
      selected: legendSelected,
      left: 'center', top: '6%',
      textStyle: { color: '#fff', fontSize: Math.max(12, titleFontSize.value * 0.65) },
      type: 'scroll', orient: 'horizontal',
      itemGap: 10, itemWidth: 15, itemHeight: 10,
      pageButtonItemGap: 5, pageButtonGap: 5,
      pageTextStyle: { color: '#fff' },
      pageIconColor: '#fff', pageIconInactiveColor: '#aaa',
    },
    grid: { left: '3%', right: '5%', bottom: '10%', top: '25%', containLabel: true },
    xAxis: {
      type: 'category', boundaryGap: false, name: '仿真时间 (s)',
      nameLocation: 'middle', nameGap: 30,
      axisLabel: { formatter: (v) => typeof v === 'number' ? v.toFixed(TARGET_TIME_STEP.toString().split('.')[1]?.length || 2) : String(v), color: '#ccc' },
      axisLine: { lineStyle: { color: '#555' } },
      nameTextStyle: { color: '#ccc', fontSize: Math.max(12, titleFontSize.value * 0.6) }
    },
    yAxis: [
      { 
        type: 'value', name: '速率/流量', position: 'left',
        nameTextStyle: { color: '#ccc', fontSize: Math.max(10, titleFontSize.value * 0.55) },
        axisLabel: { formatter: '{value}', color: '#ccc' },
        axisLine: { lineStyle: { color: hydrogonSeriesConfig.find(s=>s.yAxisIndex===0)?.color || '#555' } }, // Color based on first series using this axis
        splitLine: { show: false },
      },
      { 
        type: 'value', name: '输入参数', position: 'right',
        nameTextStyle: { color: '#ccc', fontSize: Math.max(10, titleFontSize.value * 0.55) },
        axisLabel: { formatter: '{value}', color: '#ccc' },
        axisLine: { lineStyle: { color: hydrogonSeriesConfig.find(s=>s.yAxisIndex===1)?.color || '#555' } },
        splitLine: { show: false },
      },
      { 
        type: 'value', name: 'SOH (%)', position: 'right', offset: 70, // Increased offset for better separation
        min: 0, max: 100, 
        nameTextStyle: { color: '#ccc', fontSize: Math.max(10, titleFontSize.value * 0.55) },
        axisLabel: { formatter: '{value}%', color: '#ccc' },
        axisLine: { lineStyle: { color: hydrogonSeriesConfig.find(s=>s.yAxisIndex===2)?.color || '#555' } },
        splitLine: { show: false },
      }
    ],
    dataZoom: [
      { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100, height: 20, bottom: 10,
        handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%', dataBackground: { areaStyle: { color: 'rgba(70,130,180,0.3)' }, lineStyle: { opacity: 0.8, color: '#8392A5' }},
        fillerColor: 'rgba(135,206,250,0.2)', borderColor: '#ddd', showDetail: false,
      },
      { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
    ],
    series: series
  };
  if (chartInstance) chartInstance.setOption(option, true);
};

// Removed setupLegendListener function

const screenAdapter = () => {
  if (!hydrogon_chart_element.value) return;
  titleFontSize.value = hydrogon_chart_element.value.offsetWidth / 100 * 3.0;
  if (chartInstance) chartInstance.resize();
};

watch(() => modeStore.selectedModeFolderPath, (newPath, oldPath) => {
  if (newPath && newPath !== oldPath) {
    allSeriesData.value = {}; 
    fetchDataForHydrogon();
  } else if (!newPath && oldPath) {
    allSeriesData.value = {};
    if (chartInstance) updateChart();
  }
}, { immediate: true });

onMounted(() => {
  initChart();
  screenAdapter();
  window.addEventListener('resize', screenAdapter);
  if (hydrogon_chart_element.value) {
    resizeObserver = new ResizeObserver(screenAdapter);
    resizeObserver.observe(hydrogon_chart_element.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', screenAdapter);
  if (resizeObserver && hydrogon_chart_element.value) {
    resizeObserver.unobserve(hydrogon_chart_element.value);
  }
  if (resizeObserver) resizeObserver.disconnect();
  if (chartInstance) {
    // chartInstance.off('legendselectchanged'); // Removed
    chartInstance.dispose();
    chartInstance = null;
  }
});

defineExpose({ screenAdapter });
</script>

<template>
    <div class="hydrogon_container">
        <div class="hydrogon_title_area">
            <div class="main_title_text">
                 <span>▎ {{ chartTitle }}</span>
            </div>
        </div>
        <div class="hydrogon_chart" ref="hydrogon_chart_element"></div>
    </div>
</template>

<style scoped>
.hydrogon_chart,
.hydrogon_container {
    width: 100%;
    height: 100%;
}
.hydrogon_container {
    background-color: rgba(10, 25, 47, 0.75);
    position: relative;
    display: flex; 
    flex-direction: column; 
}
.hydrogon_title_area {
    position: relative; 
    z-index: 10; 
    color: #fff;
    padding: 10px 20px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%; 
    box-sizing: border-box;
    flex-shrink: 0; 
}
.main_title_text span {
    font-size: clamp(16px, 3vw, 18px);
}
.hydrogon_chart {
    flex-grow: 1; 
    min-height: 0; 
}
</style>