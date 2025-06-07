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
const allData = ref({}) // 会存储来自API的完整数据，包括可能的type数组
const chartData = ref([]) // ECharts dataset.source
const currentDataType = ref('ev_p') // 默认加载 'ev_p'
const yAxisName = ref('功率 (watts)') // 动态Y轴名称
const seriesConfig = ref([]) // 动态series配置

// 预定义不同数据类型的配置信息
const dataTypesConfig = {
  ev_p: {
    text: '充电桩有功功率',
    chartName: 'graph/EVLog_P',
    yAxisName: '功率 (watts)',
    seriesName: '充电桩功率'
  },
  battery_p: {
    text: '蓄电池有功功率',
    chartName: 'graph/BatteryLog_P',
    yAxisName: '功率 (watts)',
    seriesName: '蓄电池功率'
  },
  grid_p: {
    text: '电网有功功率',
    chartName: 'graph/GridLog_P',
    yAxisName: '功率 (watts)',
    seriesName: '电网功率'
  },
  grid_va: {
    text: '电网电压',
    chartName: 'graph/GridLog_Va',
    yAxisName: '电压 (V)',
    seriesName: '电网电压'
  },
  load_p: {
    text: '负荷有功功率',
    chartName: 'graph/LoadLog_P',
    yAxisName: '功率 (watts)',
    seriesName: '负荷功率'
  },
  pel_p: {
    text: '电解槽有功功率',
    chartName: 'graph/PELLog_P',
    yAxisName: '功率 (watts)',
    seriesName: '电解槽功率'
  },
  pv_p: {
    text: '光伏有功功率',
    chartName: 'graph/PVLog_P',
    yAxisName: '功率 (watts)',
    seriesName: '光伏功率'
  },
  wind_p: {
    text: '风机有功功率',
    chartName: 'graph/WindLog_P',
    yAxisName: '功率 (watts)',
    seriesName: '风机功率'
  }
  // 如果后续还有 Q (无功功率) 和 Ia (电流) 的数据，可以按以下模式添加:
  // battery_q: {
  //   text: '蓄电池无功功率',
  //   chartName: 'graph/BatteryLog_Q',
  //   yAxisName: '无功功率 (var)',
  //   seriesName: '蓄电池无功功率'
  // },
  // battery_ia: {
  //   text: '蓄电池电流',
  //   chartName: 'graph/BatteryLog_Ia',
  //   yAxisName: '电流 (A)',
  //   seriesName: '蓄电池电流'
  // },
};


const getChartData = async (res) => {
    console.log('Graph: getChartData - Received raw response for type:', currentDataType.value);
    let parsedRes = res;
    if (typeof res === 'string') {
        try {
            parsedRes = JSON.parse(res);
        } catch (error) {
            console.error('Graph: getChartData - Failed to parse response string:', error, res);
            // Initialize allData.value to a structure that won't break downstream logic
            allData.value = {
                time_series: [],
                type: Object.entries(dataTypesConfig).map(([key, val]) => ({ key, text: val.text }))
            };
            handleChartData(); // Process empty data
            updataChart();
            updataChartData();
            return;
        }
    }
    console.log('Graph: getChartData - Parsed response:', parsedRes);

    const currentTypesForDropdown = Object.entries(dataTypesConfig)
        .map(([key, val]) => ({ key, text: val.text }));

    if (Array.isArray(parsedRes)) {
        // Backend sent the array directly (e.g. EVLog_P.json content), wrap it
        allData.value = { time_series: parsedRes, type: currentTypesForDropdown };
        console.log('Graph: getChartData - Wrapped array response into { time_series: ..., type: ... } structure.');
    } else if (typeof parsedRes === 'object' && parsedRes !== null) {
        // Backend sent an object. We assume it might already have time_series.
        // Ensure 'type' for the dropdown is present or added.
        allData.value = { ...parsedRes, type: currentTypesForDropdown };
        if (!parsedRes.time_series) {
             console.warn('Graph: getChartData - Received object response does not have a time_series property.', parsedRes);
             // Ensure time_series exists, even if empty, to prevent errors in handleChartData
             if (!allData.value.time_series) allData.value.time_series = [];
        }
    } else {
        console.error('Graph: getChartData - Parsed response is not an array or recognized object:', parsedRes);
        allData.value = { time_series: [], type: currentTypesForDropdown };
    }

    console.log('Graph: getChartData - allData.value after assignment and type generation:', JSON.stringify(allData.value));
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

    const option = {
        backgroundColor: 'transparent',
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '仿真时间 (seconds)', // 固定为时间序列的X轴名称
            nameLocation: 'middle',
            nameGap: 35, // 增加nameGap为X轴下方dataZoom滑块留出更多空间
            splitNumber: 8, // 建议X轴分割的段数，尝试控制标签数量
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
            bottom: '15%', // 增加底部边距给 dataZoom 滑块
        },
        dataZoom: [ // 添加 dataZoom 配置
            {
                type: 'slider', // 滑块型 dataZoom
                show: true,
                xAxisIndex: [0], // 控制X轴
                start: 0, // 默认显示从开始
                end: 100, // 默认显示到结束 (可以调整为例如 20 或更小的值，来默认显示更少的数据范围)
                height: 20, // 滑块高度
                bottom: 10, // 滑块距离底部的距离
                showDetail: false, // 不在滑块两侧显示详细的起始结束百分比
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

// 标题
const openOl = ref(false)
const choiceType = ref('ev_p') // 默认选择 'ev_p'
const graphTitle = ref(dataTypesConfig.ev_p ? dataTypesConfig.ev_p.text : '数据图表') // 初始标题，确保 ev_p 存在

const handleChangeType = (record) => {
    choiceType.value = record.key;
    currentDataType.value = record.key; // 更新当前数据类型
    graphTitle.value = record.text;

    // record.key 只会是 'wp' 或 'wq'，它们必然存在于 dataTypesConfig 中
    let targetChartName = dataTypesConfig[record.key].chartName;

    console.log(`Graph: handleChangeType - choiceType: ${choiceType.value}, determined chartName: ${targetChartName}`);
    socket.send({
        action: 'getData',
        socketType: 'graphData',
        chartName: targetChartName,
        value: ''
    });
    // getChartData 回调会处理数据更新和图表刷新
    openOl.value = !openOl.value
}

// 分辨率适配
const titleFontSize = ref(0)
const screenAdapter = () => {
    titleFontSize.value = graph_chart.value.offsetWidth / 100 * 3.6
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
        // choiceType.value 初始为 'wp'，必然存在于 dataTypesConfig
        chartName: dataTypesConfig[choiceType.value].chartName,
        value: ''
    })
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
        <div class="graph_title">
            <span>{{ '▎' + graphTitle }}</span>
            <span class="iconfont title_icon" @click="openOl = !openOl">&#xe6eb;</span>
            <ol v-show="openOl">
                <li v-for="i in allData.type" :key="i.key" @click="handleChangeType(i)">{{ i.text }}</li>
            </ol>
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
}

/* General ol/li styles removed as they were too broad or handled by specific component styles. */

.graph_title {
    position: absolute; /* This allows ol to be positioned relative to it */
    z-index: 1;
    color: #fff;
    padding: 20px;
    /* position: relative; /* Not strictly needed if .graph_container is relative and .graph_title is absolute for ol positioning */
}

.graph_title .title_icon { /* 特指 icon 的大小 */
    font-size: v-bind(titleFontSize + 'px');
    cursor: pointer; /* Add pointer cursor to icon */
    margin-left: 8px; /* Add some space between title text and icon */
}

.graph_title ol {
  position: absolute;
  top: calc(100% + 5px); /* Position below the title, with a 5px gap */
  right: 0; /* Align to the right of .graph_title, near the icon */
  background-color: rgb(41, 52, 65);
  border: 1px solid #2a3a5a;
  border-radius: 4px;
  padding: 5px 0;
  list-style: none;
  min-width: 180px; /* Adjusted min-width for better readability */
  z-index: 10; /* Ensure dropdown is above other elements like the chart */
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  overflow-y: auto; /* Add scroll for long lists if necessary */
  max-height: 200px; /* Example max-height */
}

.graph_title li {
  padding: 8px 12px;
  color: #fff;
  cursor: pointer;
  text-indent: 0; /* Reset text-indent if any was inherited */
  background-color: rgb(41, 52, 65); /* Ensure li has its own background */
}

.graph_title li:hover {
  background-color: #2a3a5a; /* Hover effect for list items */
}
/* .graph_title > span:first-child 保持原有大小或通过 titleFontSize 控制 */
</style>