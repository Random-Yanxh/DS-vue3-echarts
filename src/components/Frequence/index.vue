<script setup>
import { ref, inject, onMounted, onBeforeUnmount, watch } from 'vue';
import { useModeStore } from '@/stores/modeStore';

const echarts = inject('echarts');
const frequence_chart_element = ref(null);
let chartInstance = null;
let resizeObserver = null;

const modeStore = useModeStore();

const TARGET_TIME_STEP = 1e-3; // Target time step for downsampling

const initChart = () => {
  if (frequence_chart_element.value && !chartInstance) {
    chartInstance = echarts.init(frequence_chart_element.value, 'chalk');
    console.log("FrequenceChart: Chart initialized.");
    setupLegendListener(); // Setup listener after chart is initialized
  }
};

const yAxisName = ref('频率 (Hz)');
const chartTitle = ref('系统频率曲线');
const titleFontSize = ref(0);
const allSeriesData = ref({}); // Stores { fileName: downsampledDataArray }

const frequencySeriesConfig = [
  { name: '电网频率', fileName: 'GridLog_f', color: '#E6A23C', initiallyVisible: true },
  { name: '电池频率', fileName: 'BatteryLog_f_Hz', color: '#67C23A', initiallyVisible: false },
  { name: '充电桩频率', fileName: 'EVLog_f_Hz', color: '#409EFF', initiallyVisible: false },
  { name: '负荷频率', fileName: 'LoadLog_f', color: '#F56C6C', initiallyVisible: false },
  { name: '电解槽频率', fileName: 'PELLog_f_Hz', color: '#909399', initiallyVisible: false },
  { name: '光伏频率', fileName: 'PVLog_f', color: '#B37FEB', initiallyVisible: false },
  { name: '风机频率', fileName: 'WindLog_f', color: '#32D3EB', initiallyVisible: false },
];

function downsampleData(rawData, targetStep) {
  if (!rawData || rawData.length === 0) return [];
  const downsampled = [];
  let lastPushedTime = -Infinity;

  // Ensure the first point is always included
  if (rawData.length > 0) {
    downsampled.push(rawData[0]);
    lastPushedTime = rawData[0].time;
  }

  for (let i = 1; i < rawData.length; i++) {
    const point = rawData[i];
    if (point.time >= lastPushedTime + targetStep) {
      // If the previous point was not the one just before this target step, add it to preserve shape
      if (i > 0 && rawData[i-1].time > lastPushedTime && rawData[i-1].time < point.time && downsampled[downsampled.length-1].time !== rawData[i-1].time) {
         // Add the point just before stepping over the boundary, if it's not already the last pushed one
         if(downsampled[downsampled.length-1].time < rawData[i-1].time) {
            downsampled.push(rawData[i-1]);
         }
      }
      downsampled.push(point);
      lastPushedTime = point.time;
    }
  }

  // Ensure the very last point of the raw data is included if it wasn't captured
  if (rawData.length > 0) {
    const lastRawPoint = rawData[rawData.length - 1];
    if (downsampled.length === 0 || downsampled[downsampled.length - 1].time < lastRawPoint.time) {
      downsampled.push(lastRawPoint);
    } else if (downsampled.length > 0 && downsampled[downsampled.length - 1].time === lastRawPoint.time && downsampled[downsampled.length - 1].value !== lastRawPoint.value){
      // If times are identical but value changed (unlikely for this data but good practice)
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
      console.error(`FrequenceChart: HTTP error! status: ${response.status} for ${filePath}`);
      return [];
    }
    let jsonDataArray = await response.json();
    if (!Array.isArray(jsonDataArray)) {
      console.error(`FrequenceChart: Data from ${filePath} is not an array.`, jsonDataArray);
      return [];
    }
    jsonDataArray = jsonDataArray.map(item => ({
      time: Number(item.time),
      value: Number(item.value)
    })).filter(item => !isNaN(item.time) && !isNaN(item.value));
    
    return downsampleData(jsonDataArray, TARGET_TIME_STEP);
  } catch (error) {
    console.error(`FrequenceChart: Error fetching or parsing data from ${filePath}:`, error);
    return [];
  }
};

const fetchDataForFrequencies = async () => {
  if (!modeStore.selectedModeFolderPath) {
    console.warn("FrequenceChart: Mode folder path is missing. Clearing data.");
    allSeriesData.value = {};
    if (chartInstance) updateChart();
    return;
  }
  console.log(`FrequenceChart: Initial fetch for mode path: ${modeStore.selectedModeFolderPath}`);
  
  const newSeriesData = { ...allSeriesData.value }; // Preserve already loaded data if any

  const initialLoadPromises = frequencySeriesConfig
    .filter(conf => conf.initiallyVisible && !newSeriesData[conf.fileName]) // Only fetch if initially visible and not yet loaded
    .map(async (seriesConf) => {
      const processedData = await fetchAndProcessSeriesData(seriesConf);
      newSeriesData[seriesConf.fileName] = processedData;
    });

  await Promise.all(initialLoadPromises);
  allSeriesData.value = newSeriesData;
  console.log("FrequenceChart: Initial series data loaded and processed.");
  if (chartInstance) updateChart();
};

const updateChart = () => {
  if (!chartInstance) {
    console.warn("FrequenceChart: Chart instance not available for update.");
    return;
  }

  const series = frequencySeriesConfig.map(seriesConf => {
    const dataForSeries = allSeriesData.value[seriesConf.fileName] || [];
    return {
      name: seriesConf.name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      itemStyle: { color: seriesConf.color },
      data: dataForSeries.map(item => [item.time, item.value]),
      emphasis: { focus: 'series' },
    };
  });

  const legendSelected = {};
  frequencySeriesConfig.forEach(conf => {
    // If data exists, it means it's either initially visible or user clicked it.
    // Otherwise, respect initiallyVisible for the first load.
    // ECharts will manage selected state after initial load based on user clicks.
    legendSelected[conf.name] = !!allSeriesData.value[conf.fileName] || conf.initiallyVisible;
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
          const value = (Array.isArray(param.value) && param.value.length > 1) ? parseFloat(param.value[1]).toFixed(3) : 'N/A';
          tooltipHtml += `${param.marker} ${param.seriesName}: ${value} Hz<br/>`;
        });
        return tooltipHtml;
      }
    },
    legend: {
      data: frequencySeriesConfig.map(s => s.name),
      selected: legendSelected, // Set initial selected state
      left: 'center',
      top: '6%',
      textStyle: { color: '#fff', fontSize: Math.max(12, titleFontSize.value * 0.65) },
      type: 'scroll', orient: 'horizontal',
      itemGap: 10, itemWidth: 15, itemHeight: 10,
      pageButtonItemGap: 5, pageButtonGap: 5,
      pageTextStyle: { color: '#fff' },
      pageIconColor: '#fff', pageIconInactiveColor: '#aaa',
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '25%', containLabel: true },
    xAxis: {
      type: 'category', boundaryGap: false, name: '仿真时间 (s)',
      nameLocation: 'middle', nameGap: 30,
      axisLabel: { formatter: (v) => typeof v === 'number' ? v.toFixed(TARGET_TIME_STEP.toString().split('.')[1]?.length || 2) : String(v), color: '#ccc' },
      axisLine: { lineStyle: { color: '#555' } },
      nameTextStyle: { color: '#ccc', fontSize: Math.max(12, titleFontSize.value * 0.6) }
    },
    yAxis: {
      type: 'value', name: yAxisName.value,
      nameLocation: 'middle', nameGap: Math.max(45, titleFontSize.value * 1.8),
      axisLabel: { formatter: (v) => parseFloat(v).toFixed(2), color: '#ccc' },
      axisLine: { lineStyle: { color: '#555' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#444' } },
      nameTextStyle: { color: '#ccc', fontSize: Math.max(12, titleFontSize.value * 0.6) }
    },
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
  if (chartInstance) chartInstance.setOption(option, true); // Use true for notMerge to ensure legend state is respected
  console.log("FrequenceChart: Chart option set/updated.");
};

const setupLegendListener = () => {
  if (!chartInstance) return;
  chartInstance.on('legendselectchanged', async (params) => {
    const seriesName = params.name;
    const isSelected = params.selected[seriesName];
    const seriesConf = frequencySeriesConfig.find(s => s.name === seriesName);

    if (isSelected && seriesConf && !allSeriesData.value[seriesConf.fileName]) {
      console.log(`FrequenceChart: Legend selected for ${seriesName}, fetching data...`);
      const processedData = await fetchAndProcessSeriesData(seriesConf);
      if (processedData.length > 0) {
        allSeriesData.value = {
          ...allSeriesData.value,
          [seriesConf.fileName]: processedData
        };
        updateChart(); // Re-render with new data
      } else {
        // Fetching failed or no data, revert legend selection
        console.warn(`FrequenceChart: No data for ${seriesName} or fetch failed. Reverting legend selection.`);
        const currentSelected = chartInstance.getOption().legend[0].selected;
        currentSelected[seriesName] = false;
        chartInstance.setOption({ legend: { selected: currentSelected } });
      }
    }
  });
};


const screenAdapter = () => {
  if (!frequence_chart_element.value) return;
  titleFontSize.value = frequence_chart_element.value.offsetWidth / 100 * 3.0;
  if (chartInstance) {
    chartInstance.resize();
  }
};

watch(() => modeStore.selectedModeFolderPath, (newPath, oldPath) => {
  if (newPath && newPath !== oldPath) {
    // Clear existing data for non-initiallyVisible series when mode changes
    // and re-fetch only initially visible ones.
    const newData = {};
    Object.keys(allSeriesData.value).forEach(fileName => {
        const conf = frequencySeriesConfig.find(c => c.fileName === fileName);
        if(conf && conf.initiallyVisible) {
            // Keep data for initially visible, it will be re-fetched if needed by fetchDataForFrequencies
        } else {
            // For now, let's clear all and let fetchDataForFrequencies handle initial load
        }
    });
    allSeriesData.value = {}; // Clear all data, fetchDataForFrequencies will load initial
    fetchDataForFrequencies();
  } else if (!newPath && oldPath) {
    console.log("FrequenceChart: Mode folder path cleared, clearing chart data.");
    allSeriesData.value = {};
    if (chartInstance) updateChart();
  }
}, { immediate: true });

onMounted(() => {
  initChart(); // This will also call setupLegendListener
  screenAdapter();
  window.addEventListener('resize', screenAdapter);
  if (frequence_chart_element.value) {
    resizeObserver = new ResizeObserver(screenAdapter);
    resizeObserver.observe(frequence_chart_element.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', screenAdapter);
  if (resizeObserver && frequence_chart_element.value) {
    resizeObserver.unobserve(frequence_chart_element.value);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (chartInstance) {
    chartInstance.off('legendselectchanged'); // Clean up listener
    chartInstance.dispose();
    chartInstance = null;
  }
});

defineExpose({ screenAdapter });
</script>

<template>
    <div class="frequence_container">
        <div class="frequence_title_area">
            <div class="main_title_text">
                 <span>▎ {{ chartTitle }}</span>
            </div>
        </div>
        <div class="frequence_chart" ref="frequence_chart_element"></div>
    </div>
</template>

<style scoped>
.frequence_chart,
.frequence_container {
    width: 100%;
    height: 100%;
}

.frequence_container {
    background-color: rgba(10, 25, 47, 0.75);
    position: relative;
    display: flex; 
    flex-direction: column; 
}

.frequence_title_area {
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

.frequence_chart {
    flex-grow: 1; 
    min-height: 0; 
}
</style>