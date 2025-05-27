<script setup>
import { ref, inject, onMounted, onBeforeUnmount, onBeforeMount } from 'vue';
import useRequest from '@/composables/useRequest'

const echarts = inject('echarts')
const trend_chart = ref(null)
// const chartInstance = ref(null)      //echarts实例不能是vue3响应式对象，否则有些类型的tooltip不显示
let chartInstance = null

const initChart = () => {
    chartInstance = echarts.init(trend_chart.value, 'chalk')
}

// 初始化数据
const allData = ref({})
const chartData = ref([])
const getChartData = async (res) => {
    // const res = await useRequest('/trend')
    // console.log(res);
    allData.value = res
    handleChartData()
    updataChart()
    updataChartData()
}
const handleChartData = () => {
    // 数据处理，适配新的电力数据格式
    if (allData.value && allData.value.time_series) {
        const times = allData.value.time_series.map(item => item.time);
        const powers = allData.value.time_series.map(item => item.power);
        chartData.value = [
            ['仿真时间', ...times],
            ['风电有功', ...powers]
        ];
    } else {
        chartData.value = []; // Handle cases where data might not be available yet
    }
    // console.log(chartData.value);
}

// echarts配置
const updataChart = () => {
    const option = {
        backgroundColor: 'transparent', // 添加此行
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '仿真时间 (seconds)',
            nameLocation: 'middle',
            nameGap: 25,
            axisLabel: {
                formatter: function (value) {
                    return parseFloat(value).toFixed(3);
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '功率 (watts)',
            nameLocation: 'middle',
            nameGap: titleFontSize.value * 1.5, // Dynamically adjust gap or use a static value like 30
            axisLabel: {
                formatter: function (value) {
                    return parseFloat(value).toFixed(3);
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
                fontSize: titleFontSize.value,
            }
        },
        tooltip: {
            trigger: 'axis',
        },
        grid: {
            left: '10%',
            top: '35%',
            right: '4%',
            bottom: '10%',
            // containLabel: true,  //设置了这个会不显示，未知bug+1
        },
        series: [
            { type: 'line', name: '风电有功', seriesLayoutBy: 'row', areaStyle: { opacity: 0.1 } }
        ]
    }
    chartInstance.setOption(option)
}
const updataChartData = () => {
    const option = {
        dataset: {
            source: chartData.value,
        },
    }
    chartInstance.setOption(option)
}

// 标题
// const openOl = ref(false) // Type switching removed
// const choiceType = ref('map') // Type switching removed
const trendTitle = ref("电力数据趋势") // Updated title
// const handleChangeType = (record) => { // Type switching removed
//     choiceType.value = record.key
//     trendTitle.value = record.text
//     chartInstance.clear()
//     handleChartData()
//     updataChart()
//     updataChartData()
//     openOl.value = !openOl.value
// }

// 分辨率适配
const titleFontSize = ref(0)
const screenAdapter = () => {
    titleFontSize.value = trend_chart.value.offsetWidth / 100 * 3.6
    updataChart()
    chartInstance.resize()
}

//websocket
const socket = inject('socket')


onBeforeMount(() => {
    socket.registerCallBack('trendData', getChartData)
})
onMounted(() => {
    initChart()
    // getChartData()
    socket.send({
        action: 'getData',
        socketType: 'trendData',
        chartName: 'wp',
        value: ''
    })
    screenAdapter()
    window.addEventListener('resize', screenAdapter)
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter)
    socket.unRegisterCallBack('trendData')
})
defineExpose({
    screenAdapter
})
</script>

<template>
    <div class="trend_container">
        <div class="trend_title">
            <span>{{ '▎' + trendTitle }}</span>
            <!-- <span class="iconfont title_icon" @click="openOl = !openOl">&#xe6eb;</span>
            <ol v-show="openOl">
                <li v-for="i in allData.type" :key="i.key" @click="handleChangeType(i)">{{ i.text }}</li>
            </ol> -->
        </div>
        <div class="trend_chart" ref="trend_chart"></div>
    </div>
</template>

<style scoped>
.trend_chart,
.trend_container {
    width: 100%;
    height: 100%;
}

.trend_container {
background-color: rgba(10, 25, 47, 0.75);
    position: relative;
}

ol {
    list-style: none;
    margin: 0;
    padding: 0;
}

li {
    text-indent: .6em;
    background-color: rgb(41, 52, 65);
}

.trend_title {
    position: absolute;
    z-index: 1;
    color: #fff;
    padding: 20px;
}

.trend_title,
.title_icon {
    font-size: v-bind(titleFontSize + 'px');
}
</style>