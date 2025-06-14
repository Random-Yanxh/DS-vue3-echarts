<script setup>
import { ref, inject, onMounted, onBeforeUnmount, watch, watchEffect, computed } from 'vue';
import { useModeStore } from '@/stores/modeStore'; // Import Pinia store

const echarts = inject('echarts');
const graph_chart = ref(null);
let chartInstance = null;
let resizeObserver = null;

const modeStore = useModeStore(); // Use Pinia store

const initChart = () => {
  if (graph_chart.value) {
    chartInstance = echarts.init(graph_chart.value, 'chalk');
  }
};

const allData = ref({ time_series: [] }); // Ensure time_series is initialized
const chartData = ref([]);
const yAxisName = ref('');
const seriesConfig = ref([]);

// --- Dropdown options ---
const moduleOptions = ref([
    { key: 'BatteryLog', text: '蓄电池' },
    { key: 'EVLog', text: '充电桩' },
    { key: 'GridLog', text: '电网' },
    { key: 'LoadLog', text: '负荷' },
    { key: 'PELLog', text: '电解槽' },
    { key: 'PVLog', text: '光伏' },
    { key: 'WindLog', text: '风电机组' },
    // Note: HydrogenTankLog is in file_name_list.txt but not in original moduleOptions. Add if needed.
]);

const parameterOptions = ref([
    // These keys will be used to form the first part of dataTypesConfig keys, e.g., 'p', 'q', 'va', 'ia'
    // The text can be generic, as specific units/details will come from dataTypesConfig.
    { key: 'p', text: '有功功率' }, // Generic P, specific file chosen in dataTypesConfig
    { key: 'q', text: '无功功率' }, // Generic Q
    { key: 'va', text: 'A相电压' },  // Generic Va
    { key: 'ia', text: 'A相电流' },  // Generic Ia
    // For more specific parameters like SOC_pct, P_ref_W, they would need to be added here
    // and dataTypesConfig keys adjusted accordingly, e.g., 'soc_pct', 'p_ref_w'.
    // For simplicity now, we'll map the generic P, Q, Va, Ia to one representative file per module.
]);

const selectedModuleKey = ref('EVLog'); 
const selectedParameterKey = ref('p');   // Default to 'p' which should map to a power file

// This computed ref will form the key for dataTypesConfig
const currentDataTypeKey = computed(() => {
  if (!selectedModuleKey.value || !selectedParameterKey.value) return null;
  const modulePrefix = selectedModuleKey.value.replace('Log', '').toLowerCase();
  // For now, paramSuffix is simple. If parameterOptions become more complex (e.g., 'p_out_w'), this needs adjustment.
  const paramSuffix = selectedParameterKey.value.toLowerCase(); 
  return `${modulePrefix}_${paramSuffix}`;
});


// --- Updated dataTypesConfig based on file_name_list.txt ---
// IMPORTANT: This is a partial mapping. It needs to be fully populated based on file_name_list.txt
// and how moduleOptions/parameterOptions are intended to select these files.
// The 'chartName' is now the base filename (without .json) from public/data/<MODE_FOLDER>/
const dataTypesConfig = ref({
  // BatteryLog Examples
  battery_p: { text: '电池输出有功功率', chartName: 'BatteryLog_P_out_W', yAxisName: '有功功率 (W)', seriesName: '电池输出P' },
  battery_q: { text: '电池输出无功功率', chartName: 'BatteryLog_Q_out_VAR', yAxisName: '无功功率 (VAR)', seriesName: '电池输出Q' },
  battery_va: { text: '电池A相电压', chartName: 'BatteryLog_Va', yAxisName: 'A相电压 (V)', seriesName: '电池Va' },
  battery_ia: { text: '电池A相电流', chartName: 'BatteryLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '电池Ia' },
  battery_soc_pct: { text: '电池SOC', chartName: 'BatteryLog_SOC_pct', yAxisName: 'SOC (%)', seriesName: '电池SOC'}, // Example for a specific param

  // EVLog Examples
  ev_p: { text: '充电桩有功功率', chartName: 'EVLog_P_W', yAxisName: '有功功率 (W)', seriesName: '充电桩P' },
  ev_q: { text: '充电桩无功功率', chartName: 'EVLog_Q_VAR', yAxisName: '无功功率 (VAR)', seriesName: '充电桩Q' },
  ev_va: { text: '充电桩A相电压', chartName: 'EVLog_Va', yAxisName: 'A相电压 (V)', seriesName: '充电桩Va' },
  ev_ia: { text: '充电桩A相电流', chartName: 'EVLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '充电桩Ia' },

  // GridLog Examples
  grid_p: { text: '电网交换有功功率', chartName: 'GridLog_P', yAxisName: '有功功率 (W)', seriesName: '电网P' },
  grid_q: { text: '电网交换无功功率', chartName: 'GridLog_Q', yAxisName: '无功功率 (VAR)', seriesName: '电网Q' },
  grid_va: { text: '电网A相电压', chartName: 'GridLog_Va', yAxisName: 'A相电压 (V)', seriesName: '电网Va' },
  grid_ia: { text: '电网A相电流', chartName: 'GridLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '电网Ia' },
  
  // ... (Must be fully populated for all module/param combinations based on file_name_list.txt)
  // Placeholder for LoadLog, PELLog, PVLog, WindLog
  load_p: { text: '负荷有功功率', chartName: 'LoadLog_P', yAxisName: '有功功率 (W)', seriesName: '负荷P' },
  load_va: { text: '负荷A相电压', chartName: 'LoadLog_Va', yAxisName: 'A相电压 (V)', seriesName: '负荷Va' },
  pel_p: { text: '电解槽有功功率', chartName: 'PELLog_P_W', yAxisName: '有功功率 (W)', seriesName: '电解槽P' },
  pel_va: { text: '电解槽A相电压', chartName: 'PELLog_Va', yAxisName: 'A相电压 (V)', seriesName: '电解槽Va' },
  pv_p: { text: '光伏有功功率', chartName: 'PVLog_P', yAxisName: '有功功率 (W)', seriesName: '光伏P' },
  pv_va: { text: '光伏A相电压', chartName: 'PVLog_Va', yAxisName: 'A相电压 (V)', seriesName: '光伏Va' },
  wind_p: { text: '风电机组有功功率', chartName: 'WindLog_P', yAxisName: '有功功率 (W)', seriesName: '风电机组P' },
  wind_va: { text: '风电机组A相电压', chartName: 'WindLog_Va', yAxisName: 'A相电压 (V)', seriesName: '风电机组Va' },
  wind_q: { text: '风电机组无功功率', chartName: 'WindLog_Q', yAxisName: '无功功率 (VAR)', seriesName: '风电机组Q' },
  wind_ia: { text: '风电机组A相电流', chartName: 'WindLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '风电机组Ia' },

  load_q: { text: '负荷无功功率', chartName: 'LoadLog_Q', yAxisName: '无功功率 (VAR)', seriesName: '负荷Q' },
  load_ia: { text: '负荷A相电流', chartName: 'LoadLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '负荷Ia' },

  pel_q: { text: '电解槽无功功率', chartName: 'PELLog_Q_VAR', yAxisName: '无功功率 (VAR)', seriesName: '电解槽Q' },
  pel_ia: { text: '电解槽A相电流', chartName: 'PELLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '电解槽Ia' },

  pv_q: { text: '光伏无功功率', chartName: 'PVLog_Q', yAxisName: '无功功率 (VAR)', seriesName: '光伏Q' },
  pv_ia: { text: '光伏A相电流', chartName: 'PVLog_Ia', yAxisName: 'A相电流 (A)', seriesName: '光伏Ia' },
});

// This function receives the JSON array [ {time, value}, ... ]
const getChartData = (jsonDataArray) => {
    console.log('Graph: getChartData - Received data array for type:', currentDataTypeKey.value, jsonDataArray);
    if (Array.isArray(jsonDataArray)) {
        allData.value = { time_series: jsonDataArray };
    } else {
        console.error('Graph: getChartData - Expected jsonDataArray to be an array, got:', jsonDataArray);
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

const updataChart = () => {
    const config = dataTypesConfig.value[currentDataTypeKey.value];
    if (!config) {
        console.error(`Graph: updataChart - Invalid currentDataTypeKey: ${currentDataTypeKey.value}`);
        // Optionally clear chart or show error state
        if(chartInstance) chartInstance.clear();
        return;
    }
    yAxisName.value = config.yAxisName;
    seriesConfig.value = [{ name: config.seriesName, type: 'line', seriesLayoutBy: 'row', areaStyle: { opacity: 0.1 } }];

    const chartWidth = graph_chart.value ? graph_chart.value.offsetWidth : 0;
    const wideLayoutThreshold = 900; 
    const currentSplitNumber = chartWidth > wideLayoutThreshold ? 15 : 8;

    const option = { /* ... ECharts option setup ... (copied from existing, ensure yAxisName.value and seriesConfig.value are used) */
        backgroundColor: 'transparent',
        xAxis: { type: 'category', boundaryGap: false, name: '仿真时间 (seconds)', nameLocation: 'middle', nameGap: 35, splitNumber: currentSplitNumber, axisLabel: { formatter: (v) => typeof v === 'number' ? v.toFixed(3) : v }},
        yAxis: { type: 'value', name: yAxisName.value, nameLocation: 'middle', nameGap: titleFontSize.value * 1.8, axisLabel: { formatter: (v) => parseFloat(v).toFixed(0) }},
        legend: { left: 20, top: '7%', icon: 'circle', itemWidth: titleFontSize.value, itemHeight: titleFontSize.value, itemGap: titleFontSize.value, textStyle: { fontSize: titleFontSize.value * 0.8 }},
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
        grid: { left: '14%', top: '18%', right: '4%', bottom: '70px' },
        dataZoom: [{ type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100, height: 20, bottom: 10, handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z', handleSize: '80%', dataBackground: { areaStyle: { color: 'rgba(70,130,180,0.3)' }, lineStyle: { opacity: 0.8, color: '#8392A5' }}, fillerColor: 'rgba(135,206,250,0.2)', borderColor: '#ddd', showDetail: false, }, { type: 'inside', xAxisIndex: [0], start: 0, end: 100, }],
        series: seriesConfig.value
    };
    if (chartInstance) chartInstance.setOption(option, true); // Add true for notMerge
};
const updataChartData = () => {
    if (chartInstance) {
        chartInstance.setOption({ dataset: { source: chartData.value } });
    }
};

const openModuleOl = ref(false);
const openParameterOl = ref(false);
const graphTitle = ref('');

const fetchDataForCurrentSelection = async () => {
    if (!currentDataTypeKey.value) {
        console.warn("Graph: No valid data type key selected.");
        allData.value = { time_series: [] }; // Clear data
        handleChartData();
        updataChart();
        updataChartData();
        return;
    }
    const config = dataTypesConfig.value[currentDataTypeKey.value];
    if (config && modeStore.selectedModeFolderPath) {
        const filePath = `${modeStore.selectedModeFolderPath}${config.chartName}.json`;
        console.log(`Graph: Fetching data from: ${filePath}`);
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
            }
            const jsonDataArray = await response.json();
            getChartData(jsonDataArray);
        } catch (error) {
            console.error(`Graph: Error fetching or parsing data from ${filePath}:`, error);
            allData.value = { time_series: [] }; // Clear data on error
            handleChartData();
            updataChart();
            updataChartData();
            graphTitle.value = `${config.text} (数据加载失败)`;
        }
    } else {
        console.warn(`Graph: No configuration for ${currentDataTypeKey.value} or folderPath is missing.`);
        allData.value = { time_series: [] };
        handleChartData();
        updataChart();
        updataChartData();
        graphTitle.value = "数据未配置或路径错误";
    }
};

const handleModuleChange = (module) => {
    selectedModuleKey.value = module.key;
    openModuleOl.value = false;
    // fetchDataForCurrentSelection will be triggered by watchEffect
};

const handleParameterChange = (parameter) => {
    selectedParameterKey.value = parameter.key;
    openParameterOl.value = false;
    // fetchDataForCurrentSelection will be triggered by watchEffect
};

watchEffect(() => {
    const config = dataTypesConfig.value[currentDataTypeKey.value];
    if (config) {
        graphTitle.value = config.text;
    } else {
        const moduleText = moduleOptions.value.find(m => m.key === selectedModuleKey.value)?.text || selectedModuleKey.value || 'N/A';
        const paramText = parameterOptions.value.find(p => p.key === selectedParameterKey.value)?.text || selectedParameterKey.value || 'N/A';
        graphTitle.value = `${moduleText} - ${paramText} (未配置)`;
    }
    // Fetch data when currentDataTypeKey or selectedModeFolderPath changes
    if (currentDataTypeKey.value && modeStore.selectedModeFolderPath) {
         fetchDataForCurrentSelection();
    }
});


const screenAdapter = () => {
    if (!graph_chart.value || !chartInstance) return;
    const chartWidth = graph_chart.value.offsetWidth;
    titleFontSize.value = chartWidth / 100 * 3.6; 
    updataChart(); // Update chart options which might depend on titleFontSize
    chartInstance.resize();
};

onMounted(() => {
    initChart();
    // Initial data fetch is handled by watchEffect based on store and local selections
    screenAdapter();
    window.addEventListener('resize', screenAdapter);
    if (graph_chart.value) {
        resizeObserver = new ResizeObserver(screenAdapter);
        resizeObserver.observe(graph_chart.value);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter);
    if (resizeObserver && graph_chart.value) {
        resizeObserver.unobserve(graph_chart.value);
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
    <div class="graph_container">
        <div class="graph_title_area">
            <div class="title">▎ {{ graphTitle || '选择数据系列' }}</div>
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
        <div class="graph_chart" ref="graph_chart"></div>
    </div>
</template>

<style scoped>
/* Styles remain largely the same as current Graph.vue, ensure class names match if any were changed in template */
.graph_chart,
.graph_container {
    width: 100%;
    height: 100%;
}

.graph_container {
    background-color: rgba(10, 25, 47, 0.75);
    position: relative;
    display: flex; 
    flex-direction: column; 
}

.graph_title_area {
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

.title { /* Copied from Control.vue */
  font-size: clamp(16px, 4vw, 20px);
  color: #64ffda;
  margin-top: 15px;
  margin-bottom: 10px;
  text-shadow: 0 0 5px #64ffda;
  align-self: flex-start;
  padding-left: 5px;
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

.graph_chart {
    flex-grow: 1; 
    min-height: 0; 
}
</style>