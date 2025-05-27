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
const currentDataType = ref('wp') // 'wp' 或 'graph' (或其他未来类型)
const yAxisName = ref('功率 (watts)') // 动态Y轴名称
const seriesConfig = ref([]) // 动态series配置

// 预定义不同数据类型的配置信息
const dataTypesConfig = {
  wp: {
    text: '风电有功功率',
    chartName: 'graph/wp',
    yAxisName: '功率 (watts)',
    seriesName: '功率' // 单系列时的名称
  },
  wq: {
    text: '风电无功功率',
    chartName: 'graph/wq',
    yAxisName: '功率 (var)', // 假设单位为 var
    seriesName: '无功功率' // 单系列时的名称
  },
  graph: {
    text: '地区销量趋势', // 对应原 trend.json/graph.json
    chartName: 'graph/graph',
    yAxisName: '销量 (万)', // 假设单位
    // seriesName: null // 多系列时，名称来自数据本身
  }
  // 后续可以添加更多数据类型
};


const getChartData = async (res) => {
    console.log('Graph: getChartData - Received raw response for type:', currentDataType.value, res);
    allData.value = res; // 存储完整响应
    // 如果响应中包含type数组，则用于更新下拉列表，否则使用预定义的
    if (!res.type && choiceType.value) { // 如果获取的数据不是包含type的主数据文件
        // allData.value.type = Object.entries(dataTypesConfig).map(([key, val]) => ({key, text: val.text}));
    } else if (res.type) {
         // 如果主数据文件（如graph.json）包含了type定义，则使用它
         // 确保wp类型也在里面，或者动态添加
        let hasWp = res.type.some(t => t.key === 'wp');
        if(!hasWp) {
            // 确保 'wp' 和 'wq' (如果存在于 dataTypesConfig) 都在选项中
            const defaultTypes = Object.entries(dataTypesConfig)
              .filter(([key]) => key === 'wp' || key === 'wq') // 只添加 'wp' 和 'wq'
              .map(([key, val]) => ({ key, text: val.text }));
            // 合并，并去重（基于key）
            const combinedTypes = [...defaultTypes, ...res.type];
            const uniqueTypes = Array.from(new Map(combinedTypes.map(item => [item.key, item])).values());
            allData.value.type = uniqueTypes;
        } else {
            // 如果 res.type 已经包含了 'wp'，我们仍然需要确保 'wq' (如果它不在 res.type 中) 被添加
            let hasWq = res.type.some(t => t.key === 'wq');
            if (!hasWq && dataTypesConfig.wq) {
                 allData.value.type = [...res.type, {key: 'wq', text: dataTypesConfig.wq.text}];
            } else {
                 allData.value.type = res.type; // 如果两者都存在或wq不存在于config，则直接使用
            }
        }
    } else { // 初始加载或wp.json/wq.json加载时，手动构建type
        allData.value.type = Object.entries(dataTypesConfig)
            .filter(([key]) => key === 'wp' || key === 'wq' || key === 'graph') // 恢复包含graph
            .map(([key, val]) => ({key, text: val.text}));
    }

    console.log('Graph: getChartData - allData.value after assignment:', JSON.stringify(allData.value));
    handleChartData();
    updataChart(); // 更新图表配置，包括Y轴名称和series结构
    updataChartData(); // 更新图表数据
}

const handleChartData = () => {
    console.log('Graph: handleChartData - currentDataType:', currentDataType.value, '- allData.value at entry:', JSON.stringify(allData.value));
    if ((currentDataType.value === 'wp' || currentDataType.value === 'wq') && allData.value && allData.value.time_series) {
        const times = allData.value.time_series.map(item => item.time);
        // "wq" 数据结构与 "wp" 相同，字段名也为 "power"
        const values = allData.value.time_series.map(item => item.power);
        const seriesName = dataTypesConfig[currentDataType.value]?.seriesName || '数据';
        chartData.value = [
            ['仿真时间', ...times],
            [seriesName, ...values]
        ];
        console.log(`Graph: Processed ${currentDataType.value}.json data`);
    } else if (currentDataType.value === 'graph' && allData.value && allData.value.common && allData.value.map) { // 假设'graph'对应旧的地区销量结构
        // 保留处理原 trend.json (现在是 graph.json) 结构的数据
        // 注意：这里的 allData.value[choiceType.value] 可能需要调整，因为 choiceType.value 现在是 'graph'
        // 假设 graph.json 的数据直接在 allData.value.map.data (或其他类似路径)
        const baseData = allData.value.map; // 或者更具体的路径，取决于graph.json的实际结构
        if (baseData && baseData.data) {
            chartData.value = [
                ['月份', ...allData.value.common.month],
                ...baseData.data.map(series => [series.name, ...series.data])
            ];
            console.log('Graph: Processed graph.json (original trend) data');
        } else {
            console.warn('Graph: handleChartData - graph.json structure not as expected under allData.value.map.data');
            chartData.value = [];
        }
    } else {
        console.warn('Graph: handleChartData - Data structure not recognized or currentDataType mismatch', currentDataType.value, allData.value);
        chartData.value = [];
    }
    console.log('Graph: handleChartData - chartData.value after processing:', JSON.stringify(chartData.value));
}

// echarts配置
const updataChart = () => {
    // 根据 currentDataType 更新 seriesConfig 和 yAxisName
    if (currentDataType.value === 'wp' || currentDataType.value === 'wq') {
        yAxisName.value = dataTypesConfig[currentDataType.value]?.yAxisName || 'Y轴';
        seriesConfig.value = [{ name: dataTypesConfig[currentDataType.value]?.seriesName || '数据', type: 'line', seriesLayoutBy: 'row', areaStyle: { opacity: 0.1 } }];
    } else if (currentDataType.value === 'graph') {
        yAxisName.value = dataTypesConfig.graph?.yAxisName || 'Y轴';
        // 为 graph.json (原 trend.json) 构建多系列配置
        // 假设 chartData 已经包含了正确的系列名称在每行的第一个元素 (除了表头)
        if (chartData.value.length > 1) {
            seriesConfig.value = chartData.value.slice(1).map((_, index) => ({
                type: 'line',
                seriesLayoutBy: 'row',
                stack: 'totalAmount', // 之前的 stack: 'stack1'
                areaStyle: { opacity: 0.1 }
                // name 会由 dataset 自动映射
            }));
        } else {
            seriesConfig.value = [];
        }
    }

    const option = {
        backgroundColor: 'transparent',
        xAxis: {
            type: 'category',
            boundaryGap: false,
            // name: currentDataType.value === 'wp' ? '仿真时间 (seconds)' : '月份', // X轴名称也可以动态
            nameLocation: 'middle',
            nameGap: 25,
            axisLabel: { // X轴刻度标签格式化，仅当数据为数字时
                formatter: function (value) {
                    return typeof value === 'number' ? parseFloat(value).toFixed(3) : value;
                }
            }
        },
        yAxis: {
            type: 'value',
            name: yAxisName.value, // 使用动态Y轴名称
            nameLocation: 'middle',
            nameGap: titleFontSize.value * 1.8, // 调整间距
            axisLabel: {
                formatter: function (value) {
                    // wp 和 wq 数据3位小数，其他2位
                    return parseFloat(value).toFixed((currentDataType.value === 'wp' || currentDataType.value === 'wq') ? 3 : 2);
                }
            }
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
                if ((currentDataType.value === 'wp' || currentDataType.value === 'wq') && params.length > 0) {
                    const param = params[0]; // 单系列数据
                    const timeVal = param.axisValueLabel || param.name; // X轴的值
                    let val = null;
                    if (Array.isArray(param.value) && param.value.length > 1) {
                        val = param.value[1];
                    } else if (Array.isArray(param.data) && param.data.length > 1) {
                        val = param.data[1];
                    }

                    if (val !== undefined && val !== null) {
                        const unit = currentDataType.value === 'wp' ? 'kW' : 'kVar'; // 根据类型选择单位
                        return `${param.seriesName}<br/>${timeVal}: ${parseFloat(val).toFixed(3)} ${unit}`;
                    }
                    return `${param.seriesName}<br/>${timeVal}: N/A`;
                } else if (params.length > 0) { // 处理其他多系列数据，例如 graph.json
                    let res = params[0].name; // X轴标签
                    params.forEach(item => {
                        // 尝试从 item.value 获取，假设 item.value 是 [x, y1, y2, ...] 结构中的一部分
                        // 或者从 item.data 获取，这取决于 ECharts 如何传递数据
                        let value;
                        if (Array.isArray(item.value)) {
                             // 对于多系列，dataset.source 的结构可能是 ['月份', '北京', '上海'] , [Jan, 100, 200]
                             // item.seriesIndex 对应 '北京' (0), '上海' (1) 等系列
                             // item.value 通常是 [xValue, yValueForThisSeries] 或者 [xValue, yValue1, yValue2, ...]
                             // 如果 seriesLayoutBy: 'row', 且 source 的第一行是维度名，第二行开始是系列名和数据
                             // 那么 item.value 应该是 [xAxisValue, seriesValue]
                             // 如果 seriesLayoutBy: 'column', 则结构不同
                             // 假设 seriesLayoutBy: 'row' 且数据格式为 ['月份', '系列1', '系列2'], [Jan, val1, val2]
                             // params[i].value 将是 [Jan, val_i]
                             // 因此，我们直接取 value[1]
                            value = item.value[1];
                        } else if (item.data && Array.isArray(item.data) && item.data.length > item.seriesIndex + 1) {
                            // 这是一个更通用的回退，如果 item.value 不是预期的数组
                            // 并且 item.data 是一个数组，其中包含了当前系列的数据
                            value = item.data[item.seriesIndex + 1]; // 假设数据在 item.data 中按系列索引排列
                        } else if (typeof item.value === 'number') {
                            value = item.value; // 如果直接是数值
                        }

                        if (value !== undefined && value !== null) {
                           res += `<br/>${item.seriesName}: ${parseFloat(value).toFixed(2)}`; // 其他数据保留两位小数
                        } else {
                           res += `<br/>${item.seriesName}: N/A`;
                        }
                    });
                    return res;
                }
                return '';
            }
        },
        grid: {
            left: '10%',
            top: '35%',
            right: '4%',
            bottom: '10%',
        },
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
const choiceType = ref('wp') // 默认选择 'wp' (风电有功功率)
const graphTitle = ref(dataTypesConfig.wp.text) // 初始标题

const handleChangeType = (record) => {
    choiceType.value = record.key;
    currentDataType.value = record.key; // 更新当前数据类型
    graphTitle.value = record.text;

    let targetChartName = dataTypesConfig[record.key]?.chartName || 'graph/graph'; // 从配置获取chartName

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
        chartName: dataTypesConfig[choiceType.value]?.chartName || 'graph/wp', // 初始加载时使用 choiceType 的配置
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