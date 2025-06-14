<script setup>
import { ref, inject, onMounted, onBeforeUnmount, onBeforeMount, watchEffect } from 'vue';
// import useRequest from '@/composables/useRequest' // No longer used directly for main data

const echarts = inject('echarts')
const indicators_chart_element = ref(null) // Changed ref name
let chartInstance = null
let resizeObserver = null;

const initChart = () => {
    if (indicators_chart_element.value) {
        chartInstance = echarts.init(indicators_chart_element.value, 'chalk')
    }
}

const allData = ref({}) 
const chartData = ref([]) 
const yAxisName = ref('')
const seriesConfig = ref([])

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
    { key: 'P', text: 'P--有功功率' },
    { key: 'Q', text: 'Q--无功功率' },
    { key: 'Va', text: 'Va--电压' },
    { key: 'Ia', text: 'Ia--电流' },
]);

const selectedModuleKey = ref('BatteryLog'); // Default module for Indicators, can be different from Graph
const selectedParameterKey = ref('P');   // Default parameter

const currentDataType = ref('battery_p'); // Initial value based on default selection

const dataTypesConfig = {
  battery_p: { text: '蓄电池有功功率', chartName: 'graph/BatteryLog_P', yAxisName: '功率 (watts)', seriesName: '蓄电池有功功率' },
  battery_q: { text: '蓄电池无功功率', chartName: 'graph/BatteryLog_Q', yAxisName: '无功功率 (var)', seriesName: '蓄电池无功功率' },
  battery_va: { text: '蓄电池电压', chartName: 'graph/BatteryLog_Va', yAxisName: '电压 (V)', seriesName: '蓄电池电压' },
  battery_ia: { text: '蓄电池电流', chartName: 'graph/BatteryLog_Ia', yAxisName: '电流 (A)', seriesName: '蓄电池电流' },
  ev_p: { text: '充电桩有功功率', chartName: 'graph/EVLog_P', yAxisName: '功率 (watts)', seriesName: '充电桩有功功率' },
  ev_q: { text: '充电桩无功功率', chartName: 'graph/EVLog_Q', yAxisName: '无功功率 (var)', seriesName: '充电桩无功功率' },
  ev_va: { text: '充电桩电压', chartName: 'graph/EVLog_Va', yAxisName: '电压 (V)', seriesName: '充电桩电压' },
  ev_ia: { text: '充电桩电流', chartName: 'graph/EVLog_Ia', yAxisName: '电流 (A)', seriesName: '充电桩电流' },
  grid_p: { text: '电网有功功率', chartName: 'graph/GridLog_P', yAxisName: '功率 (watts)', seriesName: '电网有功功率' },
  grid_q: { text: '电网无功功率', chartName: 'graph/GridLog_Q', yAxisName: '无功功率 (var)', seriesName: '电网无功功率' },
  grid_va: { text: '电网电压', chartName: 'graph/GridLog_Va', yAxisName: '电压 (V)', seriesName: '电网电压' },
  grid_ia: { text: '电网电流', chartName: 'graph/GridLog_Ia', yAxisName: '电流 (A)', seriesName: '电网电流' },
  load_p: { text: '负荷有功功率', chartName: 'graph/LoadLog_P', yAxisName: '功率 (watts)', seriesName: '负荷有功功率' },
  load_q: { text: '负荷无功功率', chartName: 'graph/LoadLog_Q', yAxisName: '无功功率 (var)', seriesName: '负荷无功功率' },
  load_va: { text: '负荷电压', chartName: 'graph/LoadLog_Va', yAxisName: '电压 (V)', seriesName: '负荷电压' },
  load_ia: { text: '负荷电流', chartName: 'graph/LoadLog_Ia', yAxisName: '电流 (A)', seriesName: '负荷电流' },
  pel_p: { text: '电解槽有功功率', chartName: 'graph/PELLog_P', yAxisName: '功率 (watts)', seriesName: '电解槽有功功率' },
  pel_q: { text: '电解槽无功功率', chartName: 'graph/PELLog_Q', yAxisName: '无功功率 (var)', seriesName: '电解槽无功功率' },
  pel_va: { text: '电解槽电压', chartName: 'graph/PELLog_Va', yAxisName: '电压 (V)', seriesName: '电解槽电压' },
  pel_ia: { text: '电解槽电流', chartName: 'graph/PELLog_Ia', yAxisName: '电流 (A)', seriesName: '电解槽电流' },
  pv_p: { text: '光伏有功功率', chartName: 'graph/PVLog_P', yAxisName: '功率 (watts)', seriesName: '光伏有功功率' },
  pv_q: { text: '光伏无功功率', chartName: 'graph/PVLog_Q', yAxisName: '无功功率 (var)', seriesName: '光伏无功功率' },
  pv_va: { text: '光伏电压', chartName: 'graph/PVLog_Va', yAxisName: '电压 (V)', seriesName: '光伏电压' },
  pv_ia: { text: '光伏电流', chartName: 'graph/PVLog_Ia', yAxisName: '电流 (A)', seriesName: '光伏电流' },
  wind_p: { text: '风机有功功率', chartName: 'graph/WindLog_P', yAxisName: '功率 (watts)', seriesName: '风机有功功率' },
  wind_q: { text: '风机无功功率', chartName: 'graph/WindLog_Q', yAxisName: '无功功率 (var)', seriesName: '风机无功功率' },
  wind_va: { text: '风机电压', chartName: 'graph/WindLog_Va', yAxisName: '电压 (V)', seriesName: '风机电压' },
  wind_ia: { text: '风机电流', chartName: 'graph/WindLog_Ia', yAxisName: '电流 (A)', seriesName: '风机电流' },
};

const getChartData = async (res) => {
    console.log('Indicators: getChartData - Received raw response for type:', currentDataType.value);
    let parsedRes = res;
    if (typeof res === 'string') {
        try {
            parsedRes = JSON.parse(res);
        } catch (error) {
            console.error('Indicators: getChartData - Failed to parse response string:', error, res);
            allData.value = { time_series: [] };
            handleChartData(); 
            updataChart();
            updataChartData();
            return;
        }
    }
    console.log('Indicators: getChartData - Parsed response:', parsedRes);

    if (Array.isArray(parsedRes)) {
        allData.value = { time_series: parsedRes };
    } else if (typeof parsedRes === 'object' && parsedRes !== null) {
        allData.value = parsedRes; 
        if (!allData.value.time_series) {
             console.warn('Indicators: getChartData - Received object response does not have a time_series property.', parsedRes);
             allData.value.time_series = [];
        }
    } else {
        console.error('Indicators: getChartData - Parsed response is not an array or recognized object:', parsedRes);
        allData.value = { time_series: [] };
    }
    handleChartData();
    updataChart();
    updataChartData();
}

const handleChartData = () => {
    console.log('Indicators: handleChartData - currentDataType:', currentDataType.value);
    if (allData.value && Array.isArray(allData.value.time_series)) {
        if (allData.value.time_series.length === 0) {
            chartData.value = [];
        } else {
            const times = allData.value.time_series.map(item => item.time);
            const values = allData.value.time_series.map(item => item.value);
            if (dataTypesConfig[currentDataType.value]) {
                const seriesName = dataTypesConfig[currentDataType.value].seriesName;
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
}

const titleFontSize = ref(0) 

const updataChart = () => {
    if (!dataTypesConfig[currentDataType.value]) {
        console.error(`Indicators: updataChart - Invalid currentDataType: ${currentDataType.value}`);
        return;
    }
    yAxisName.value = dataTypesConfig[currentDataType.value].yAxisName;
    seriesConfig.value = [{ name: dataTypesConfig[currentDataType.value].seriesName, type: 'line', seriesLayoutBy: 'row', areaStyle: { opacity: 0.1 } }];

    const chartWidth = indicators_chart_element.value ? indicators_chart_element.value.offsetWidth : 0;
    const wideLayoutThreshold = 900; 
    const currentSplitNumber = chartWidth > wideLayoutThreshold ? 15 : 8;

    const option = {
        backgroundColor: 'transparent',
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '仿真时间 (seconds)',
            nameLocation: 'middle',
            nameGap: 35,
            splitNumber: currentSplitNumber,
            axisLabel: { 
                formatter: function (value) {
                    return typeof value === 'number' ? parseFloat(value).toFixed(3) : value;
                },
            }
        },
        yAxis: {
            type: 'value',
            name: yAxisName.value,
            nameLocation: 'middle',
            nameGap: titleFontSize.value * 1.8,
            axisLabel: {
                formatter: function (value) {
                    return parseFloat(value).toFixed(0);
                }
            },
        },
        legend: {
            left: 20,
            top: '15%',
            icon: 'circle',
            itemWidth: titleFontSize.value,
            itemHeight: titleFontSize.value,
            itemGap: titleFontSize.value,
            textStyle: {
                fontSize: titleFontSize.value * 0.8,
            },
        },
        tooltip: {
            trigger: 'axis',
            formatter: function (params) {
                if (params.length > 0) {
                    const param = params[0];
                    const timeValRaw = param.axisValueLabel || param.name; 
                    let timeValFormatted = timeValRaw; 
                    if (typeof timeValRaw === 'number') {
                        timeValFormatted = timeValRaw.toFixed(5);
                    } else if (typeof timeValRaw === 'string') {
                        const parsedNum = parseFloat(timeValRaw);
                        if (!isNaN(parsedNum)) {
                            timeValFormatted = parsedNum.toFixed(5);
                        }
                    }
                    let val = null;
                    if (Array.isArray(param.value) && param.value.length > 1) {
                        val = param.value[1];
                    } else if (Array.isArray(param.data) && param.data.length > 1) {
                        val = param.data[1];
                    }
                    if (val !== undefined && val !== null && dataTypesConfig[currentDataType.value]) {
                        const config = dataTypesConfig[currentDataType.value];
                        const unit = config.yAxisName.includes('(') ? config.yAxisName.match(/\(([^)]+)\)/)[1] : '';
                        return `${param.seriesName}<br/>${timeValFormatted}: ${parseFloat(val).toFixed(3)} ${unit}`;
                    }
                    return `${param.seriesName}<br/>${timeValFormatted}: N/A`;
                }
                return '';
            }
        },
        grid: {
            left: '14%', 
            top: '35%',
            right: '4%',
            bottom: '70px', 
        },
        dataZoom: [
            {
                type: 'slider',
                show: true, 
                xAxisIndex: [0],
                start: 0,
                end: 100,
                height: 20,
                bottom: 10, 
                handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '80%',
                dataBackground: {
                    areaStyle: { color: 'rgba(70,130,180,0.3)' },
                    lineStyle: { opacity: 0.8, color: '#8392A5' }
                },
                fillerColor: 'rgba(135,206,250,0.2)', 
                borderColor: '#ddd',
                showDetail: false,
            },
            {
                type: 'inside', 
                xAxisIndex: [0], 
                start: 0,
                end: 100,
            }
        ],
        series: seriesConfig.value
    }
    if (chartInstance) chartInstance.setOption(option)
}
const updataChartData = () => {
    const option = {
        dataset: {
            source: chartData.value,
        },
    }
    if (chartInstance) chartInstance.setOption(option)
}

const openModuleOl = ref(false);
const openParameterOl = ref(false);
const chartTitle = ref(''); // Changed from graphTitle

const moduleKeyToPrefix = (moduleKey) => {
    if (!moduleKey) return '';
    return moduleKey.replace('Log', '').toLowerCase();
};

const updateAndFetchData = () => {
    if (!selectedModuleKey.value || !selectedParameterKey.value) {
        return;
    }
    const modulePrefix = moduleKeyToPrefix(selectedModuleKey.value);
    const paramSuffix = selectedParameterKey.value.toLowerCase();
    const newDataTypeKey = `${modulePrefix}_${paramSuffix}`;

    if (dataTypesConfig[newDataTypeKey]) {
        currentDataType.value = newDataTypeKey;
        const currentConfig = dataTypesConfig[newDataTypeKey];
        socket.send({
            action: 'getData',
            socketType: 'graphData', // Assuming Indicators uses the same socketType
            chartName: currentConfig.chartName,
            value: ''
        });
    } else {
        chartData.value = []; 
        // chartTitle.value = "数据未配置"; // Title updated by watchEffect
        if (chartInstance) {
            updataChart(); 
            updataChartData();
        }
    }
};

const handleModuleChange = (module) => {
    selectedModuleKey.value = module.key;
    openModuleOl.value = false; 
    updateAndFetchData(); 
};

const handleParameterChange = (parameter) => {
    selectedParameterKey.value = parameter.key;
    openParameterOl.value = false; 
    updateAndFetchData(); 
};

watchEffect(() => {
    const modulePrefix = moduleKeyToPrefix(selectedModuleKey.value);
    const paramSuffix = selectedParameterKey.value ? selectedParameterKey.value.toLowerCase() : '';
    
    if (modulePrefix && paramSuffix) {
        const key = `${modulePrefix}_${paramSuffix}`;
        if (dataTypesConfig[key]) {
            chartTitle.value = dataTypesConfig[key].text;
        } else {
            const moduleText = moduleOptions.value.find(m => m.key === selectedModuleKey.value)?.text || selectedModuleKey.value;
            const paramTextObj = parameterOptions.value.find(p => p.key === selectedParameterKey.value);
            const paramDisplayText = paramTextObj ? paramTextObj.text.substring(paramTextObj.text.indexOf('--') + 2) : selectedParameterKey.value;
            chartTitle.value = `${moduleText} - ${paramDisplayText} (未配置)`;
        }
    } else {
         const moduleText = moduleOptions.value.find(m => m.key === selectedModuleKey.value)?.text || '选择模块';
         const paramTextObj = parameterOptions.value.find(p => p.key === selectedParameterKey.value);
         const paramDisplayText = paramTextObj ? paramTextObj.text.substring(paramTextObj.text.indexOf('--') + 2) : '选择参数';
         chartTitle.value = `${moduleText} - ${paramDisplayText}`;
    }
});

const screenAdapter = () => {
    if (!indicators_chart_element.value || !chartInstance) return;
    const chartWidth = indicators_chart_element.value.offsetWidth;
    titleFontSize.value = chartWidth / 100 * 3.6; 
    updataChart()
    chartInstance.resize()
}

const socket = inject('socket')

onBeforeMount(() => {
    socket.registerCallBack('graphData', getChartData) // Assuming Indicators uses the same callback type
})
onMounted(() => {
    initChart()
    // Initial data fetch based on default selectedModuleKey and selectedParameterKey
    if (dataTypesConfig[currentDataType.value]) {
         socket.send({
            action: 'getData',
            socketType: 'graphData',
            chartName: dataTypesConfig[currentDataType.value].chartName,
            value: ''
        });
    } else { // Fallback if initial currentDataType is somehow invalid
        updateAndFetchData(); // This will also handle the "not configured" case
    }
   
    screenAdapter() 
    window.addEventListener('resize', screenAdapter)

    if (indicators_chart_element.value) {
        resizeObserver = new ResizeObserver(() => {
            screenAdapter();
        });
        resizeObserver.observe(indicators_chart_element.value);
    }
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter)
    socket.unRegisterCallBack('graphData') 

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
})
defineExpose({
    screenAdapter
})
</script>

<template>
    <div class="indicators_container"> <!-- Changed class from graph_container -->
        <div class="indicators_title_area"> <!-- Changed class from graph_title_area -->
            <div class="main_title_text">
                <!-- Display dynamic title, or a static one if preferred -->
                <span>▎ {{ chartTitle || '关键指标图表' }}</span> 
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
        <div class="indicators_chart" ref="indicators_chart_element"></div> <!-- Changed class and ref -->
    </div>
</template>

<style scoped>
/* Styles copied from Graph.vue, with s/graph_/indicators_/ for top-level classes */
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
    /* font-size: v-bind(titleFontSize * 0.9 + 'px'); */ /* Using chartTitle directly now */
    font-size: clamp(16px, 3vw, 18px); /* Example static size if not binding */
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
  background-color: #2a3a5a; /* Consistent hover */
}

.indicators_chart {
    flex-grow: 1; 
    min-height: 0; 
}
</style>