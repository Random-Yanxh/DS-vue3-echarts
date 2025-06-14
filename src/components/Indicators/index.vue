<script setup>
import { ref, inject, onMounted, onBeforeUnmount, watch, watchEffect, computed } from 'vue';
import { useModeStore } from '@/stores/modeStore'; // Import Pinia store

const echarts = inject('echarts');
const indicators_chart_element = ref(null); // Specific ref name for this component
let chartInstance = null;
let resizeObserver = null;

const modeStore = useModeStore(); // Use Pinia store

const initChart = () => {
  if (indicators_chart_element.value) {
    chartInstance = echarts.init(indicators_chart_element.value, 'chalk');
  }
};

const allData = ref({ time_series: [] });
const chartData = ref([]);
const yAxisName = ref('');
const seriesConfig = ref([]);

const moduleOptions = ref([
    { key: 'BatteryLog', text: '蓄电池' },
    { key: 'EVLog', text: '充电桩' },
    { key: 'GridLog', text: '电网' },
    { key: 'LoadLog', text: '负荷' },
    { key: 'PELLog', text: '电解槽' },
    { key: 'PVLog', text: '光伏' },
    { key: 'WindLog', text: '风机' },
]);

const parameterOptions = ref([
    { key: 'p', text: '有功功率' },
    { key: 'q', text: '无功功率' },
    { key: 'va', text: 'A相电压' },
    { key: 'ia', text: 'A相电流' },
]);

// Default selection for Indicators component
const selectedModuleKey = ref('BatteryLog'); 
const selectedParameterKey = ref('p');   

const currentDataTypeKey = computed(() => {
  if (!selectedModuleKey.value || !selectedParameterKey.value) return null;
  const modulePrefix = selectedModuleKey.value.replace('Log', '').toLowerCase();
  const paramSuffix = selectedParameterKey.value.toLowerCase(); 
  return `${modulePrefix}_${paramSuffix}`;
});

// Updated dataTypesConfig - Ensure this is comprehensive and accurate based on file_name_list.txt
const dataTypesConfig = ref({
  battery_p: { text: '电池输出有功功率', chartName: 'BatteryLog_P_out_W', yAxisName: '有功功率 (W)', seriesName: '电池输出P' },
  battery_q: { text: '电池输出无功功率', chartName: 'BatteryLog_Q_out_VAR', yAxisName: '无功功率 (VAR)', seriesName: '电池输出Q' },
  battery_va: { text: '电池A相电压', chartName: 'BatteryLog_Va', yAxisName: 'A相电压 (V)', seriesName: '电池Va' },
  battery_ia: { text: '电池A相电流', chartName: 'BatteryLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '电池Ia' },
  
  ev_p: { text: '充电桩有功功率', chartName: 'EVLog_P_W', yAxisName: '有功功率 (W)', seriesName: '充电桩P' },
  ev_q: { text: '充电桩无功功率', chartName: 'EVLog_Q_VAR', yAxisName: '无功功率 (VAR)', seriesName: '充电桩Q' },
  ev_va: { text: '充电桩A相电压', chartName: 'EVLog_Va', yAxisName: 'A相电压 (V)', seriesName: '充电桩Va' },
  ev_ia: { text: '充电桩A相电流', chartName: 'EVLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '充电桩Ia' },

  grid_p: { text: '电网交换有功功率', chartName: 'GridLog_P', yAxisName: '有功功率 (W)', seriesName: '电网P' },
  grid_q: { text: '电网交换无功功率', chartName: 'GridLog_Q', yAxisName: '无功功率 (VAR)', seriesName: '电网Q' },
  grid_va: { text: '电网A相电压', chartName: 'GridLog_Va', yAxisName: 'A相电压 (V)', seriesName: '电网Va' },
  grid_ia: { text: '电网A相电流', chartName: 'GridLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '电网Ia' },
  
  load_p: { text: '负荷有功功率', chartName: 'LoadLog_P', yAxisName: '有功功率 (W)', seriesName: '负荷P' },
  load_va: { text: '负荷A相电压', chartName: 'LoadLog_Va', yAxisName: 'A相电压 (V)', seriesName: '负荷Va' },
  pel_p: { text: '电解槽有功功率', chartName: 'PELLog_P_W', yAxisName: '有功功率 (W)', seriesName: '电解槽P' },
  pel_va: { text: '电解槽A相电压', chartName: 'PELLog_Va', yAxisName: 'A相电压 (V)', seriesName: '电解槽Va' },
  pv_p: { text: '光伏有功功率', chartName: 'PVLog_P', yAxisName: '有功功率 (W)', seriesName: '光伏P' },
  pv_va: { text: '光伏A相电压', chartName: 'PVLog_Va', yAxisName: 'A相电压 (V)', seriesName: '光伏Va' },
  wind_p: { text: '风机有功功率', chartName: 'WindLog_P', yAxisName: '有功功率 (W)', seriesName: '风机P' },
  wind_va: { text: '风机A相电压', chartName: 'WindLog_Va', yAxisName: 'A相电压 (V)', seriesName: '风机Va' },
  // Add other necessary mappings from file_name_list.txt
});

const getChartData = (jsonDataArray) => {
    console.log('Indicators: getChartData - Received data array for type:', currentDataTypeKey.value, jsonDataArray);
    if (Array.isArray(jsonDataArray)) {
        allData.value = { time_series: jsonDataArray };
    } else {
        console.error('Indicators: getChartData - Expected jsonDataArray to be an array, got:', jsonDataArray);
        allData.value = { time_series: [] };
    }
    handleChartData();
    updataChart();
    updataChartData();
};

const handleChartData = () => {
    if (allData.value && Array.isArray(allData.value.time_series)) {
        if (allData.value.time_series.length === 0) {
            chartData.value = [];
        } else {
            const times = allData.value.time_series.map(item => item.time);
            const values = allData.value.time_series.map(item => item.value);
            const config = dataTypesConfig.value[currentDataTypeKey.value];
            if (config) {
                const seriesName = config.seriesName;
                chartData.value = [
                    ['仿真时间', ...times],
                    [seriesName, ...values]
                ];
            } else {
                chartData.value = [];
            }
        }
    } else {
        chartData.value = [];
    }
};

const titleFontSize = ref(0);
const chartTitle = ref(''); // Title for this chart instance

const updataChart = () => {
    const config = dataTypesConfig.value[currentDataTypeKey.value];
    if (!config) {
        console.error(`Indicators: updataChart - Invalid currentDataTypeKey: ${currentDataTypeKey.value}`);
        if(chartInstance) chartInstance.clear();
        return;
    }
    yAxisName.value = config.yAxisName;
    seriesConfig.value = [{ name: config.seriesName, type: 'line', seriesLayoutBy: 'row', areaStyle: { opacity: 0.1 } }];

    const chartWidth = indicators_chart_element.value ? indicators_chart_element.value.offsetWidth : 0;
    const wideLayoutThreshold = 900; 
    const currentSplitNumber = chartWidth > wideLayoutThreshold ? 15 : 8;

    const option = { /* ... ECharts option setup (same as Graph.vue) ... */
        backgroundColor: 'transparent',
        xAxis: { type: 'category', boundaryGap: false, name: '仿真时间 (seconds)', nameLocation: 'middle', nameGap: 35, splitNumber: currentSplitNumber, axisLabel: { formatter: (v) => typeof v === 'number' ? v.toFixed(3) : v }},
        yAxis: { type: 'value', name: yAxisName.value, nameLocation: 'middle', nameGap: titleFontSize.value * 1.8, axisLabel: { formatter: (v) => parseFloat(v).toFixed(0) }},
        legend: { left: 20, top: '15%', icon: 'circle', itemWidth: titleFontSize.value, itemHeight: titleFontSize.value, itemGap: titleFontSize.value, textStyle: { fontSize: titleFontSize.value * 0.8 }},
        tooltip: { trigger: 'axis', formatter: (params) => {
            if (params.length > 0) {
                const param = params[0];
                const timeValRaw = param.axisValueLabel || param.name; 
                let timeValFormatted = typeof timeValRaw === 'number' ? timeValRaw.toFixed(5) : String(timeValRaw);
                let val = (Array.isArray(param.value) && param.value.length > 1) ? param.value[1] : ((Array.isArray(param.data) && param.data.length > 1) ? param.data[1] : null);
                const currentConfig = dataTypesConfig.value[currentDataTypeKey.value];
                if (val !== null && currentConfig) {
                    const unit = currentConfig.yAxisName.includes('(') ? currentConfig.yAxisName.match(/\(([^)]+)\)/)[1] : '';
                    return `${param.seriesName}<br/>${timeValFormatted}: ${parseFloat(val).toFixed(3)} ${unit}`;
                } return `${param.seriesName}<br/>${timeValFormatted}: N/A`;
            } return '';
        }},
        grid: { left: '14%', top: '35%', right: '4%', bottom: '70px' },
        dataZoom: [{ type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100, height: 20, bottom: 10, handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z', handleSize: '80%', dataBackground: { areaStyle: { color: 'rgba(70,130,180,0.3)' }, lineStyle: { opacity: 0.8, color: '#8392A5' }}, fillerColor: 'rgba(135,206,250,0.2)', borderColor: '#ddd', showDetail: false, }, { type: 'inside', xAxisIndex: [0], start: 0, end: 100, }],
        series: seriesConfig.value
    };
    if (chartInstance) chartInstance.setOption(option, true);
};
const updataChartData = () => {
    if (chartInstance) {
        chartInstance.setOption({ dataset: { source: chartData.value } });
    }
};

const openModuleOl = ref(false);
const openParameterOl = ref(false);

const fetchDataForCurrentSelection = async () => {
    if (!currentDataTypeKey.value) {
        console.warn("Indicators: No valid data type key selected.");
        allData.value = { time_series: [] };
        handleChartData();
        updataChart();
        updataChartData();
        return;
    }
    const config = dataTypesConfig.value[currentDataTypeKey.value];
    if (config && modeStore.selectedModeFolderPath) {
        const filePath = `${modeStore.selectedModeFolderPath}${config.chartName}.json`;
        console.log(`Indicators: Fetching data from: ${filePath}`);
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
            }
            const jsonDataArray = await response.json();
            getChartData(jsonDataArray);
        } catch (error) {
            console.error(`Indicators: Error fetching or parsing data from ${filePath}:`, error);
            allData.value = { time_series: [] };
            handleChartData();
            updataChart();
            updataChartData();
            chartTitle.value = `${config.text} (数据加载失败)`;
        }
    } else {
        console.warn(`Indicators: No configuration for ${currentDataTypeKey.value} or folderPath is missing.`);
        allData.value = { time_series: [] };
        handleChartData();
        updataChart();
        updataChartData();
        chartTitle.value = "数据未配置或路径错误";
    }
};

const handleModuleChange = (module) => {
    selectedModuleKey.value = module.key;
    openModuleOl.value = false;
};

const handleParameterChange = (parameter) => {
    selectedParameterKey.value = parameter.key;
    openParameterOl.value = false;
};

watchEffect(() => {
    const config = dataTypesConfig.value[currentDataTypeKey.value];
    if (config) {
        chartTitle.value = config.text;
    } else {
        const moduleText = moduleOptions.value.find(m => m.key === selectedModuleKey.value)?.text || selectedModuleKey.value || 'N/A';
        const paramText = parameterOptions.value.find(p => p.key === selectedParameterKey.value)?.text || selectedParameterKey.value || 'N/A';
        chartTitle.value = `${moduleText} - ${paramText} (未配置)`;
    }
    if (currentDataTypeKey.value && modeStore.selectedModeFolderPath) {
         fetchDataForCurrentSelection();
    }
});

const screenAdapter = () => {
    if (!indicators_chart_element.value || !chartInstance) return;
    const chartWidth = indicators_chart_element.value.offsetWidth;
    titleFontSize.value = chartWidth / 100 * 3.6; 
    updataChart();
    chartInstance.resize();
};

onMounted(() => {
    initChart();
    screenAdapter();
    window.addEventListener('resize', screenAdapter);
    if (indicators_chart_element.value) {
        resizeObserver = new ResizeObserver(screenAdapter);
        resizeObserver.observe(indicators_chart_element.value);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter);
    if (resizeObserver && indicators_chart_element.value) {
        resizeObserver.unobserve(indicators_chart_element.value);
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
});

defineExpose({ screenAdapter });
</script>

<template>
    <div class="indicators_container">
        <div class="indicators_title_area">
            <div class="main_title_text">
                 <span>▎ {{ chartTitle || '选择数据系列' }}</span>
            </div>
            <div class="dropdown_controls">
                <div class="control_group">
                    <span class="control_label">模块:</span>
                    <div class="selected_display" @click="openModuleOl = !openModuleOl; openParameterOl = false;">
                        <span>{{ moduleOptions.find(m => m.key === selectedModuleKey)?.text || '选择模块' }}</span>
                        <span class="iconfont control_icon">&#xe6eb;</span>
                    </div>
                    <ol v-show="openModuleOl" class="control_dropdown module_dropdown_list">
                        <li v-for="moduleItem in moduleOptions" :key="moduleItem.key" @click="handleModuleChange(moduleItem)">
                            {{ moduleItem.text }}
                        </li>
                    </ol>
                </div>
                <div class="control_group">
                    <span class="control_label">参数:</span>
                    <div class="selected_display" @click="openParameterOl = !openParameterOl; openModuleOl = false;">
                        <span>{{ parameterOptions.find(p => p.key === selectedParameterKey)?.text || '选择参数' }}</span>
                        <span class="iconfont control_icon">&#xe6eb;</span>
                    </div>
                    <ol v-show="openParameterOl" class="control_dropdown parameter_dropdown_list">
                        <li v-for="parameterItem in parameterOptions" :key="parameterItem.key" @click="handleParameterChange(parameterItem)">
                            {{ parameterItem.text }}
                        </li>
                    </ol>
                </div>
            </div>
        </div>
        <div class="indicators_chart" ref="indicators_chart_element"></div>
    </div>
</template>

<style scoped>
/* Styles are identical to Graph.vue, but with 'indicators_' prefix for top-level classes */
.indicators_chart,
.indicators_container {
    width: 100%;
    height: 100%;
}

.indicators_container {
    background-color: rgba(10, 25, 47, 0.75);
    position: relative;
    display: flex; 
    flex-direction: column; 
}

.indicators_title_area {
    position: relative; 
    z-index: 10; 
    color: #fff;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%; 
    box-sizing: border-box;
    flex-shrink: 0; 
}

.main_title_text span {
    font-size: clamp(16px, 3vw, 18px); 
    margin-right: 20px; 
}

.dropdown_controls {
    display: flex;
    gap: 15px; 
}

.control_group {
    position: relative; 
    display: flex;
    align-items: center;
}

.control_label {
    margin-right: 5px;
    font-size: 13px; 
    white-space: nowrap;
}

.selected_display {
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: rgba(30, 50, 80, 0.85); 
    padding: 5px 8px; 
    border-radius: 4px;
    border: 1px solid #3a4a6a; 
    min-width: auto; 
    justify-content: space-between;
}

.selected_display span:first-child {
    font-size: 13px; 
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px; 
}

.control_icon {
    font-size: 12px; 
    margin-left: 6px;
}

.control_dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: rgb(35, 45, 60); 
  border: 1px solid #4a5a7a; 
  border-radius: 4px;
  padding: 4px 0;
  list-style: none;
  min-width: 160px; 
  width: max-content; 
  max-width: 240px; 
  z-index: 20;
  box-shadow: 0 3px 7px rgba(0,0,0,0.3); 
  overflow-y: auto;
  max-height: 220px;
}

.control_dropdown li {
  padding: 7px 14px; 
  color: #ddeeff; 
  cursor: pointer;
  text-indent: 0;
  background-color: transparent; 
  font-size: 13px; 
  white-space: nowrap;
}

.control_dropdown li:hover {
  background-color: #2a3a5a;
}

.indicators_chart {
    flex-grow: 1; 
    min-height: 0; 
}
</style>