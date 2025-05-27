<script setup>//占比饼图
import { ref, inject, onMounted, onBeforeUnmount, computed } from 'vue';
import useRequest from '@/composables/useRequest'

const echarts = inject('echarts')
const epie_chart = ref(null)
let chartInstance = null
const initChart = () => {
    chartInstance = echarts.init(epie_chart.value, 'chalk')
}

const allData = ref([])
const getData = async () => {
    const res = await useRequest('/epie')
    if (res && res.length > 0) {
        if (res.length >= 2) { // 如果至少有两个数据项
            // 根据 epie.json 的实际内容，"数据1" 是 res[0]，"数据7" 是 res[1]
            allData.value = [res[0], res[1]];
        } else { // res.length is 1
            allData.value = [res[0]];
        }
    } else { // res is null, undefined, or empty array
        allData.value = [];
    }
    // 确保 currentIndex 在有效范围内，如果 allData 变短，可能需要重置
    if (allData.value.length > 0 && currentIndex.value >= allData.value.length) {
        currentIndex.value = 0;
    } else if (allData.value.length === 0) {
        currentIndex.value = 0; // 或者处理无数据的情况
    }
    updataChart()
    updataChartData()
}

const updataChart = () => {
    if (!currentData.value) { // 如果 currentData 无效（例如 allData 为空），则不更新
        if (chartInstance) {
            chartInstance.clear(); // 清除图表内容
        }
        return;
    }
    const option = {
        backgroundColor: 'transparent', // 添加此行
        title: {
            text: `▎能源占比——${currentData.value.name}`,
            top: '5%',
            left: 20,
        },
        legend: {
            bottom: '3%',
            icon: 'circle',
        },
        tooltip: {
            formatter: (arg) => {
                // return arg.data.children.map(i => `${i.name}：${i.value}`).join('<br/>')  //两者皆可
                return arg.data.children.map(i => `<p>${i.name}：${i.value}</p>`).join('')
            }
        },
        series: {
            name: `${currentData.value.name}`,
            type: 'pie',
            label: {
                show: false
            },
            radius: 140,
            emphasis: {
                label: {
                    show: true
                },
                labelLine: {
                    show: false
                }
            }
        }
    }
    chartInstance.setOption(option)
}

const currentIndex = ref(0)
const currentData = computed(() => {
    if (!allData.value || allData.value.length === 0) {
        return undefined;
    }
    // currentIndex.value is ensured to be within valid bounds by changeCurrent
    return allData.value[currentIndex.value];
})

const updataChartData = () => {
    if (!currentData.value || !currentData.value.children) { // 如果 currentData 或其 children 无效，则不更新
        return;
    }
    const option = {
        dataset: {
            source: currentData.value.children
        }
    }
    chartInstance.setOption(option)
}

const changeCurrent = (value) => {
    if (!allData.value || allData.value.length === 0) { // 如果 allData 为空，不执行切换
        return;
    }
    // 当 allData.value.length 为 1 时，取模结果总是 0，currentIndex 不会改变
    if (value === 'left') {
        currentIndex.value = (currentIndex.value - 1 + allData.value.length) % allData.value.length;
    } else {
        currentIndex.value = (currentIndex.value + 1) % allData.value.length;
    }
    updataChart()
    updataChartData()
}

const screenAdapter = () => {
    const titleFontSize = epie_chart.value.offsetWidth / 100 * 3.6
    const adapterOption = {
        title: {
            textStyle: {
                fontSize: titleFontSize
            }
        },
        legend: {
            itemWidth: titleFontSize,
            itemHeight: titleFontSize,
            textStyle: {
                fontSize: titleFontSize / 1.5
            }
        }
    }
    chartInstance.setOption(adapterOption)
    chartInstance.resize()
}

onMounted(() => {
    initChart()
    getData()
    screenAdapter()
    window.addEventListener('resize', screenAdapter)
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter)
})
defineExpose({
    screenAdapter
})
</script>

<template>
    <div class="epie_container">
        <div class="epie_chart" ref="epie_chart"></div>
        <span class="iconfont arr_left" @click="changeCurrent('left')">&#xe6ef;</span>
        <span class="iconfont arr_right" @click="changeCurrent('right')">&#xe6ed;</span>
    </div>
</template>

<style scoped>
.epie_container {
background-color: rgba(10, 25, 47, 0.75);
    position: relative;
}

.epie_container,
.epie_chart {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.arr_left,
.arr_right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    cursor: pointer;
    font-size: 50px;
}

.arr_left {
    left: 10%;
}

.arr_right {
    right: 10%;
}
</style>