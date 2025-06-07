<script setup>
import { ref, inject, onMounted, onBeforeUnmount, onBeforeMount } from 'vue';
import useRequest from '@/composables/useRequest'

const echarts = inject('echarts')
const graph_chart = ref(null)
// const chartInstance = ref(null)      //echarts实例不能是vue3响应式对象，否则有些类型的tooltip不显示
let chartInstance = null

const initChart = () => {
    chartInstance = echarts.init(graph_chart.value, 'chalk')
}

// 初始化数据
const allData = ref({}) // 会存储来自API的完整数据
const chartData = ref([]) // ECharts dataset.source
// yAxisName 和 seriesConfig 会在 updataChart 中根据 currentDataType 设置，初始值影响不大
const yAxisName = ref('')
const seriesConfig = ref([])

// --- 新的状态和选项 для двух выпадающих списков ---
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

const selectedModuleKey = ref('EVLog'); // 默认模块
const selectedParameterKey = ref('P');   // 默认参数

// currentDataType 仍然是核心的内部状态，由选定的模块和参数派生而来
const currentDataType = ref('ev_p'); // 初始值基于默认选择

// 预定义所有28种数据类型的配置信息
const dataTypesConfig = {
  // BatteryLog
  battery_p: { text: '蓄电池有功功率', chartName: 'graph/BatteryLog_P', yAxisName: '功率 (watts)', seriesName: '蓄电池有功功率' },
  battery_q: { text: '蓄电池无功功率', chartName: 'graph/BatteryLog_Q', yAxisName: '无功功率 (var)', seriesName: '蓄电池无功功率' },
  battery_va: { text: '蓄电池电压', chartName: 'graph/BatteryLog_Va', yAxisName: '电压 (V)', seriesName: '蓄电池电压' },
  battery_ia: { text: '蓄电池电流', chartName: 'graph/BatteryLog_Ia', yAxisName: '电流 (A)', seriesName: '蓄电池电流' },
  // EVLog
  ev_p: { text: '充电桩有功功率', chartName: 'graph/EVLog_P', yAxisName: '功率 (watts)', seriesName: '充电桩有功功率' },
  ev_q: { text: '充电桩无功功率', chartName: 'graph/EVLog_Q', yAxisName: '无功功率 (var)', seriesName: '充电桩无功功率' },
  ev_va: { text: '充电桩电压', chartName: 'graph/EVLog_Va', yAxisName: '电压 (V)', seriesName: '充电桩电压' },
  ev_ia: { text: '充电桩电流', chartName: 'graph/EVLog_Ia', yAxisName: '电流 (A)', seriesName: '充电桩电流' },
  // GridLog
  grid_p: { text: '电网有功功率', chartName: 'graph/GridLog_P', yAxisName: '功率 (watts)', seriesName: '电网有功功率' },
  grid_q: { text: '电网无功功率', chartName: 'graph/GridLog_Q', yAxisName: '无功功率 (var)', seriesName: '电网无功功率' },
  grid_va: { text: '电网电压', chartName: 'graph/GridLog_Va', yAxisName: '电压 (V)', seriesName: '电网电压' },
  grid_ia: { text: '电网电流', chartName: 'graph/GridLog_Ia', yAxisName: '电流 (A)', seriesName: '电网电流' },
  // LoadLog
  load_p: { text: '负荷有功功率', chartName: 'graph/LoadLog_P', yAxisName: '功率 (watts)', seriesName: '负荷有功功率' },
  load_q: { text: '负荷无功功率', chartName: 'graph/LoadLog_Q', yAxisName: '无功功率 (var)', seriesName: '负荷无功功率' },
  load_va: { text: '负荷电压', chartName: 'graph/LoadLog_Va', yAxisName: '电压 (V)', seriesName: '负荷电压' },
  load_ia: { text: '负荷电流', chartName: 'graph/LoadLog_Ia', yAxisName: '电流 (A)', seriesName: '负荷电流' },
  // PELLog
  pel_p: { text: '电解槽有功功率', chartName: 'graph/PELLog_P', yAxisName: '功率 (watts)', seriesName: '电解槽有功功率' },
  pel_q: { text: '电解槽无功功率', chartName: 'graph/PELLog_Q', yAxisName: '无功功率 (var)', seriesName: '电解槽无功功率' },
  pel_va: { text: '电解槽电压', chartName: 'graph/PELLog_Va', yAxisName: '电压 (V)', seriesName: '电解槽电压' },
  pel_ia: { text: '电解槽电流', chartName: 'graph/PELLog_Ia', yAxisName: '电流 (A)', seriesName: '电解槽电流' },
  // PVLog
  pv_p: { text: '光伏有功功率', chartName: 'graph/PVLog_P', yAxisName: '功率 (watts)', seriesName: '光伏有功功率' },
  pv_q: { text: '光伏无功功率', chartName: 'graph/PVLog_Q', yAxisName: '无功功率 (var)', seriesName: '光伏无功功率' },
  pv_va: { text: '光伏电压', chartName: 'graph/PVLog_Va', yAxisName: '电压 (V)', seriesName: '光伏电压' },
  pv_ia: { text: '光伏电流', chartName: 'graph/PVLog_Ia', yAxisName: '电流 (A)', seriesName: '光伏电流' },
  // WindLog
  wind_p: { text: '风机有功功率', chartName: 'graph/WindLog_P', yAxisName: '功率 (watts)', seriesName: '风机有功功率' },
  wind_q: { text: '风机无功功率', chartName: 'graph/WindLog_Q', yAxisName: '无功功率 (var)', seriesName: '风机无功功率' },
  wind_va: { text: '风机电压', chartName: 'graph/WindLog_Va', yAxisName: '电压 (V)', seriesName: '风机电压' },
  wind_ia: { text: '风机电流', chartName: 'graph/WindLog_Ia', yAxisName: '电流 (A)', seriesName: '风机电流' },
};
// --- END ---


const getChartData = async (res) => {
    console.log('Graph: getChartData - Received raw response for type:', currentDataType.value);
    let parsedRes = res;
    if (typeof res === 'string') {
        try {
            parsedRes = JSON.parse(res);
        } catch (error) {
            console.error('Graph: getChartData - Failed to parse response string:', error, res);
            // Initialize allData.value to a structure that won't break downstream logic
            allData.value = { time_series: [] }; // 清除旧的 type 属性
            handleChartData(); // Process empty data
            updataChart();
            updataChartData();
            return;
        }
    }
    console.log('Graph: getChartData - Parsed response:', parsedRes);

    // 移除 currentTypesForDropdown 和 allData.value.type 的赋值
    if (Array.isArray(parsedRes)) {
        allData.value = { time_series: parsedRes };
        console.log('Graph: getChartData - Wrapped array response into { time_series: ... } structure.');
    } else if (typeof parsedRes === 'object' && parsedRes !== null) {
        allData.value = parsedRes; // 假设后端可能发送 { time_series: [...] }
        if (!allData.value.time_series) { // 确保 time_series 存在
             console.warn('Graph: getChartData - Received object response does not have a time_series property.', parsedRes);
             allData.value.time_series = [];
        }
    } else {
        console.error('Graph: getChartData - Parsed response is not an array or recognized object:', parsedRes);
        allData.value = { time_series: [] };
    }

    console.log('Graph: getChartData - allData.value after assignment:', JSON.stringify(allData.value));
    handleChartData();
    updataChart();
    updataChartData();
}

const handleChartData = () => {
    console.log('Graph: handleChartData - currentDataType:', currentDataType.value);
    console.log('Graph: handleChartData - allData.value at entry:', JSON.stringify(allData.value));

    if (allData.value && Array.isArray(allData.value.time_series)) {
        if (allData.value.time_series.length === 0) {
            console.log('Graph: handleChartData - time_series is empty.');
            chartData.value = [];
        } else {
            // 假设 time_series 中的每个元素都有 time 和 value
            const times = allData.value.time_series.map(item => item.time);
            const values = allData.value.time_series.map(item => item.value); // 直接使用 item.value

            // 确保 currentDataType.value 存在于 dataTypesConfig 中以获取 seriesName
            if (dataTypesConfig[currentDataType.value]) {
                const seriesName = dataTypesConfig[currentDataType.value].seriesName;
                chartData.value = [
                    ['仿真时间', ...times],
                    [seriesName, ...values]
                ];
                console.log(`Graph: Processed ${currentDataType.value} data. First few data points for values:`, values.slice(0, 5));
            } else {
                console.warn(`Graph: handleChartData - currentDataType '${currentDataType.value}' not found in dataTypesConfig.`);
                chartData.value = [];
            }
        }
    } else {
        console.warn('Graph: handleChartData - allData.value.time_series is not an array or allData.value is null/undefined.', allData.value);
        chartData.value = []; // Clear chart data if structure is wrong
    }
    console.log('Graph: handleChartData - chartData.value after processing (first 5 rows if large):', chartData.value.length > 0 ? chartData.value.map(row => row.slice(0,6)) : []);
}

// echarts配置
const updataChart = () => {
    // 根据 currentDataType 更新 seriesConfig 和 yAxisName
    // graph 类型已移除，只处理 wp 和 wq
    yAxisName.value = dataTypesConfig[currentDataType.value].yAxisName;
    seriesConfig.value = [{ name: dataTypesConfig[currentDataType.value].seriesName, type: 'line', seriesLayoutBy: 'row', areaStyle: { opacity: 0.1 } }];

    const chartWidth = graph_chart.value ? graph_chart.value.offsetWidth : 0;
    const wideLayoutThreshold = 900; // 定义宽度阈值 (像素)
    const currentSplitNumber = chartWidth > wideLayoutThreshold ? 15 : 8;

    const option = {
        backgroundColor: 'transparent',
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '仿真时间 (seconds)', // 固定为时间序列的X轴名称
            nameLocation: 'middle',
            nameGap: 35, // 增加nameGap为X轴下方dataZoom滑块留出更多空间
            splitNumber: currentSplitNumber, // 根据宽度动态设置
            axisLabel: { // X轴刻度标签格式化
                formatter: function (value) {
                    // X轴时间标签显示3位小数以减少拥挤, Tooltip中仍为5位
                    return typeof value === 'number' ? parseFloat(value).toFixed(3) : value;
                },
                // rotate: 30, // 如果标签依然拥挤，可以取消注释此行来旋转标签
            }
        },
        yAxis: {
            type: 'value',
            name: yAxisName.value, // 使用动态Y轴名称
            nameLocation: 'middle',
            nameGap: titleFontSize.value * 1.8, // 适当调整Y轴标题与轴的间距, 可能需要根据grid.left调整
            axisLabel: {
                formatter: function (value) {
                    // 将 Y 轴数值格式化为整数（不显示小数）
                    return parseFloat(value).toFixed(0);
                }
            },
            // splitNumber: 5, // 可以尝试调整Y轴的分割段数以优化刻度显示
        },
        legend: {
            left: 20,
            top: '15%',
            icon: 'circle',
            itemWidth: titleFontSize.value,
            itemHeight: titleFontSize.value,
            itemGap: titleFontSize.value,
            textStyle: {
                fontSize: titleFontSize.value * 0.8, // 调整图例字体大小
            },
            // data: legendData.value // 动态图例数据
        },
        tooltip: {
            trigger: 'axis', // 对于折线图，通常用 'axis'
            formatter: function (params) {
                // 只处理单系列 (wp/wq)
                if (params.length > 0) {
                    const param = params[0];
                    const timeValRaw = param.axisValueLabel || param.name; // 原始X轴值
                    let timeValFormatted = timeValRaw; // 格式化后的X轴值

                    // 尝试将timeValRaw格式化为三位小数的数字字符串
                    // 尝试将timeValRaw格式化为五位小数的数字字符串
                    if (typeof timeValRaw === 'number') {
                        timeValFormatted = timeValRaw.toFixed(5);
                    } else if (typeof timeValRaw === 'string') {
                        const parsedNum = parseFloat(timeValRaw);
                        if (!isNaN(parsedNum)) {
                            timeValFormatted = parsedNum.toFixed(5);
                        }
                        // 如果不能解析为数字，则保持原样 (timeValFormatted 初始值就是 timeValRaw)
                    }

                    let val = null;
                    if (Array.isArray(param.value) && param.value.length > 1) {
                        val = param.value[1];
                    } else if (Array.isArray(param.data) && param.data.length > 1) {
                        val = param.data[1];
                    }

                    if (val !== undefined && val !== null) {
                        const config = dataTypesConfig[currentDataType.value];
                        // 从 yAxisName (例如 "功率 (watts)") 中提取单位
                        const unit = config.yAxisName.includes('(') ? config.yAxisName.match(/\(([^)]+)\)/)[1] : '';
                        return `${param.seriesName}<br/>${timeValFormatted}: ${parseFloat(val).toFixed(3)} ${unit}`;
                    }
                    return `${param.seriesName}<br/>${timeValFormatted}: N/A`;
                }
                return '';
            }
        },
        grid: {
            left: '14%', // 增加左边距，使Y轴标签能完整显示
            top: '35%',
            right: '4%',
            bottom: '70px', // 固定像素值，为dataZoom确保足够空间
        },
        dataZoom: [
            {
                type: 'slider',
                show: true, // 确保滑块显示
                xAxisIndex: [0],
                start: 0,
                end: 100,
                height: 20,
                bottom: 10, // 标准的底部距离
                handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '80%',
                dataBackground: {
                    areaStyle: {
                        color: 'rgba(70,130,180,0.3)'
                    },
                    lineStyle: {
                        opacity: 0.8,
                        color: '#8392A5'
                    }
                },
                fillerColor: 'rgba(135,206,250,0.2)', // 滑块选中区域颜色
                borderColor: '#ddd',
                showDetail: false,
            },
            {
                type: 'inside', // 内置型 dataZoom，支持鼠标滚轮在图表区域内缩放
                xAxisIndex: [0], // 控制X轴
                start: 0,
                end: 100,
            }
        ],
        series: seriesConfig.value
    }
    chartInstance.setOption(option)
}
const updataChartData = () => {
    const option = {
        dataset: {
            source: chartData.value,
        },
    }
    console.log('Graph: updataChartData - dataset.source being set:', JSON.stringify(chartData.value));
    chartInstance.setOption(option)
}

// 标题和下拉列表控制
const openModuleOl = ref(false);
const openParameterOl = ref(false);
const graphTitle = ref(''); // 将由 watchEffect 或 updateAndFetchData 更新

// 辅助函数，将模块键（如 'BatteryLog'）转换为前缀（如 'battery'）
const moduleKeyToPrefix = (moduleKey) => {
    if (!moduleKey) return '';
    return moduleKey.replace('Log', '').toLowerCase();
};

// 核心函数：当模块或参数选择变化时，更新数据类型、标题并获取数据
const updateAndFetchData = () => {
    if (!selectedModuleKey.value || !selectedParameterKey.value) {
        console.warn("Graph: Module or Parameter not selected yet for fetching data.");
        return;
    }

    const modulePrefix = moduleKeyToPrefix(selectedModuleKey.value);
    const paramSuffix = selectedParameterKey.value.toLowerCase();
    const newDataTypeKey = `${modulePrefix}_${paramSuffix}`;

    if (dataTypesConfig[newDataTypeKey]) {
        currentDataType.value = newDataTypeKey; // 更新当前的内部数据类型键
        const currentConfig = dataTypesConfig[newDataTypeKey];
        // graphTitle.value = currentConfig.text; // 标题更新移至 watchEffect

        console.log(`Graph: Requesting data for Module: ${selectedModuleKey.value}, Param: ${selectedParameterKey.value}. DataTypeKey: ${newDataTypeKey}, ChartName: ${currentConfig.chartName}`);
        socket.send({
            action: 'getData',
            socketType: 'graphData',
            chartName: currentConfig.chartName,
            value: ''
        });
        // getChartData 回调会处理数据更新和图表刷新 (updataChart, updataChartData)
    } else {
        console.error(`Graph: No configuration found for key ${newDataTypeKey} (Module: ${selectedModuleKey.value}, Param: ${selectedParameterKey.value})`);
        chartData.value = []; // 清空图表数据
        graphTitle.value = "数据未配置"; // 设置错误标题
        if (chartInstance) { // 确保 chartInstance 已初始化
             // 调用 updataChart 来更新轴名称等，即使数据为空
            updataChart(); // 这会使用新的(可能无效的)currentDataType, yAxisName可能需要默认值
            updataChartData(); // 这会设置空的 dataset
        }
    }
};

// 模块选择处理函数
const handleModuleChange = (module) => {
    selectedModuleKey.value = module.key;
    openModuleOl.value = false; // 关闭模块下拉
    updateAndFetchData(); // 获取新数据
};

// 参数选择处理函数
const handleParameterChange = (parameter) => {
    selectedParameterKey.value = parameter.key;
    openParameterOl.value = false; // 关闭参数下拉
    updateAndFetchData(); // 获取新数据
};

// 使用 watchEffect 动态更新图表标题，确保响应性和正确性
import { watchEffect } from 'vue';
watchEffect(() => {
    const modulePrefix = moduleKeyToPrefix(selectedModuleKey.value);
    const paramSuffix = selectedParameterKey.value ? selectedParameterKey.value.toLowerCase() : '';
    
    if (modulePrefix && paramSuffix) {
        const key = `${modulePrefix}_${paramSuffix}`;
        if (dataTypesConfig[key]) {
            graphTitle.value = dataTypesConfig[key].text;
        } else {
            // 如果组合无效，显示一个通用或默认的标题
            const moduleText = moduleOptions.value.find(m => m.key === selectedModuleKey.value)?.text || selectedModuleKey.value;
            const paramTextObj = parameterOptions.value.find(p => p.key === selectedParameterKey.value);
            const paramDisplayText = paramTextObj ? paramTextObj.text.substring(paramTextObj.text.indexOf('--') + 2) : selectedParameterKey.value;
            graphTitle.value = `${moduleText} - ${paramDisplayText} (未配置)`;
        }
    } else {
        // 初始或部分选择时的标题
         const moduleText = moduleOptions.value.find(m => m.key === selectedModuleKey.value)?.text || '选择模块';
         const paramTextObj = parameterOptions.value.find(p => p.key === selectedParameterKey.value);
         const paramDisplayText = paramTextObj ? paramTextObj.text.substring(paramTextObj.text.indexOf('--') + 2) : '选择参数';
         graphTitle.value = `${moduleText} - ${paramDisplayText}`;
    }
});

// 分辨率适配
const titleFontSize = ref(0) // Base for main title (though text is hidden), can be kept for other potential uses
const controlTextSize = ref(0) // New ref for dropdown control text size

const screenAdapter = () => {
    if (!graph_chart.value) return;
    const chartWidth = graph_chart.value.offsetWidth;
    titleFontSize.value = chartWidth / 100 * 3.6; // This is for ECharts internal elements like axis names
    // controlTextSize.value = chartWidth / 100 * 1.6; // 移除 controlTextSize, 使用固定像素值
    updataChart()
    chartInstance.resize()
}

//websocket
const socket = inject('socket')


onBeforeMount(() => {
    socket.registerCallBack('graphData', getChartData)
})
onMounted(() => {
    initChart()
    // getChartData()
    socket.send({
        action: 'getData',
        socketType: 'graphData',
        // 使用 currentDataType (基于默认的 selectedModuleKey 和 selectedParameterKey)
        chartName: dataTypesConfig[currentDataType.value] ? dataTypesConfig[currentDataType.value].chartName : '',
        value: ''
    });
    // 初始加载时，标题将由 watchEffect 设置，数据由上面的 socket.send 获取
    screenAdapter()
    window.addEventListener('resize', screenAdapter)
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter)
    socket.unRegisterCallBack('graphData')
})
defineExpose({
    screenAdapter
})
</script>

<template>
    <div class="graph_container">
        <div class="graph_title_area">
            <div class="main_title_text">
                <span>▎</span>
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
        <div class="graph_chart" ref="graph_chart"></div>
    </div>
</template>

<style scoped>
.graph_chart,
.graph_container {
    width: 100%;
    height: 100%;
}

.graph_container {
    background-color: rgba(10, 25, 47, 0.75);
    position: relative;
    display: flex; /* Use flex for overall layout */
    flex-direction: column; /* Stack title area and chart vertically */
}

.graph_title_area {
    position: relative; /* Changed from absolute to flow with flex */
    z-index: 10; /* Ensure it's above the chart if any overlap, though flex should prevent it */
    color: #fff;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%; /* Ensure it takes full width */
    box-sizing: border-box;
    flex-shrink: 0; /* Prevent title area from shrinking */
}

.main_title_text span {
    font-size: v-bind(titleFontSize * 0.9 + 'px');
    margin-right: 20px; /* Add some space if title is long */
}

.dropdown_controls {
    display: flex;
    gap: 15px; /* Reduced gap between control groups */
}

.control_group {
    position: relative; /* For absolute positioning of the dropdown list */
    display: flex;
    align-items: center;
}

.control_label {
    margin-right: 5px;
    font-size: 13px; /* 固定字号 */
    white-space: nowrap;
}

.selected_display {
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: rgba(30, 50, 80, 0.85); /* 微调背景色 */
    padding: 5px 8px; /* 调整内边距以适应13px字体 */
    border-radius: 4px;
    border: 1px solid #3a4a6a; /* 微调边框色 */
    min-width: auto; /* 让内容和padding决定宽度 */
    justify-content: space-between;
}

.selected_display span:first-child {
    font-size: 13px; /* 固定字号 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px; /* 允许稍长一点的文本 */
}

.control_icon {
    font-size: 12px; /* 固定字号 */
    margin-left: 6px;
}

.control_dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: rgb(35, 45, 60); /* 深一点的背景 */
  border: 1px solid #4a5a7a; /* 微调边框色 */
  border-radius: 4px;
  padding: 4px 0;
  list-style: none;
  min-width: 160px; /* 调整最小宽度以容纳典型选项 */
  width: max-content; /* 允许内容撑开，但受max-width限制 */
  max-width: 240px; /* 防止过长 */
  z-index: 20;
  box-shadow: 0 3px 7px rgba(0,0,0,0.3); /* 稍明显的阴影 */
  overflow-y: auto;
  max-height: 220px;
}

.control_dropdown li {
  padding: 7px 14px; /* 调整内边距 */
  color: #ddeeff; /* 亮一点的文字颜色 */
  cursor: pointer;
  text-indent: 0;
  background-color: transparent; /* 使用父级背景色 */
  font-size: 13px; /* 固定字号 */
  white-space: nowrap;
}

.control_dropdown li:hover {
  background-color: rgba(70, 130, 180, 0.3); /* 更明显的hover效果 */
}

.control_dropdown li:hover {
  background-color: #2a3a5a;
}

/* Ensure chart takes remaining space */
.graph_chart {
    flex-grow: 1; /* Allow chart to take available vertical space */
    min-height: 0; /* Important for flex-grow to work correctly in a flex column */
}
</style>