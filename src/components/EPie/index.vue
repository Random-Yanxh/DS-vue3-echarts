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
            show: false // 禁用 Tooltip
        },
        series: {
            name: `${currentData.value.name}`,
            type: 'pie',
            label: {
                show: true, // 标签常显
                formatter: '{b}:\n{d}%', // 名称和百分比换行显示
                position: 'outside', // 将标签放在外部
                color: '#fff',       // 字体颜色设为白色
                // fontSize: 12,     // 可以设置一个固定值，或在screenAdapter中动态调整
                textBorderColor: 'transparent', // 去除描边
                textBorderWidth: 0,
                overflow: 'truncate', // 内容过长时截断，可根据需要设为 'break' 或 'none'
                ellipsis: '...'       // 截断时显示的后缀
            },
            labelLine: {
                show: true,
                length: 6,    // 配合饼图缩小，略微缩短引导线
                length2: 10,  // 配合饼图缩小，略微缩短引导线
                smooth: 0.5   // 平滑曲线 0-1
            },
            radius: '55%', // 改为实心饼图，并缩小尺寸
            emphasis: {
                label: {
                    show: true, // 高亮时也显示标签
                    fontSize: 14, // 高亮时标签字体可以稍大
                    fontWeight: 'bold'
                },
                labelLine: {
                    show: true // 高亮时也显示引导线
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
        },
        series: [{ // 确保在series数组中，如果只有一个series
            label: {
                fontSize: titleFontSize / 1.3 // 动态调整标签字体大小
            },
            labelLine: {
                // 如果需要，也可以在这里动态调整引导线长度
            }
        }]
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
    top: 75%;
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