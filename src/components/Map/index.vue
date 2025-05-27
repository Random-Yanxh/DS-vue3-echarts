<script setup>
import { ref, inject, onMounted, onBeforeUnmount } from 'vue';
import useRequest from '@/composables/useRequest'
const echarts = inject('echarts')
const map_chart = ref(null)
let chartInstance = null

// 将 categories 定义移到这里，使其在 updataChart 和 updataChartData 中都可访问
const categories = [
    { name: '电网', itemStyle: { color: '#555' } }, // 对应 type 'grid'
    { name: '交流母线', itemStyle: { color: '#1E90FF' } }, // 对应 type 'bus_ac'
    { name: '光伏发电', itemStyle: { color: '#FFD700' } }, // 对应 type 'generation_pv'
    { name: '电池储能', itemStyle: { color: '#FF9800' } }, // 对应 type 'storage_battery'
    { name: '固定负荷', itemStyle: { color: '#8BC34A' } }, // 对应 type 'load_fixed'
    // 可以根据需要添加更多类型，确保 name 与 node.type 的部分匹配逻辑一致或直接使用 node.type
];
const initChart = () => {
    chartInstance = echarts.init(map_chart.value, 'chalk')
    // 移除地图点击事件
}

// 移除 getAreaData 函数

const updataChart = () => {
    const titleFontSize = map_chart.value.offsetWidth / 100 * 3.6;
    const categories = [ // 定义节点类别，用于图例和样式
        { name: '电网', itemStyle: { color: '#555' } },
        { name: '交流母线', itemStyle: { color: '#1E90FF' } },
        { name: '光伏发电', itemStyle: { color: '#FFD700' } },
        { name: '电池储能', itemStyle: { color: '#FF9800' } },
        { name: '固定负荷', itemStyle: { color: '#8BC34A' } },
        // 可以根据需要添加更多类型
    ];
    const option = {
        backgroundColor: 'transparent', // 添加此行
        title: {
            text: "▎微电网拓扑图",
            left: 20,
            top: 20,
            textStyle: {
                fontSize: map_chart.value.offsetWidth / 100 * 2.5,
            }
        },
        tooltip: { // 添加 tooltip 配置
            trigger: 'item',
            formatter: function (params) {
                if (params.dataType === 'node') {
                    let tooltipText = `<strong>${params.data.name}</strong> (类型: ${params.data.type})`;
                    if (params.data.status) tooltipText += `<br/>状态: ${params.data.status}`;
                    if (params.data.powerExchange !== undefined) tooltipText += `<br/>交换功率: ${params.data.powerExchange} kW`;
                    if (params.data.currentPower !== undefined) tooltipText += `<br/>实时功率: ${params.data.currentPower} kW`;
                    if (params.data.dailyEnergy !== undefined) tooltipText += `<br/>日发电量: ${params.data.dailyEnergy} kWh`;
                    if (params.data.soc !== undefined) tooltipText += `<br/>SOC: ${params.data.soc}%`;
                    if (params.data.power !== undefined && params.data.type === 'storage_battery') tooltipText += `<br/>充放功率: ${params.data.power} kW`;
                    if (params.data.voltage !== undefined) tooltipText += `<br/>电压: ${params.data.voltage} V`;
                    return tooltipText;
                } else if (params.dataType === 'edge') {
                    return `<strong>${params.data.name || params.data.type}</strong><br/>功率流: ${params.data.powerFlow || 'N/A'} kW`;
                }
                return params.name;
            }
        },
        legend: [{ // 添加图例配置
            data: categories.map(function (a) { return a.name; }),
            bottom: 10,
            itemWidth: titleFontSize * 0.8,
            itemHeight: titleFontSize * 0.8,
            textStyle: {
                fontSize: titleFontSize * 0.6,
                color: '#fff'
            }
        }],
        series: [
            {
                name: '微电网拓扑',
                type: 'graph',
                layout: 'none',
                roam: true,
                categories: categories, // 引入 categories
                label: {
                    show: true,
                    position: 'bottom',
                    formatter: '{b}',
                    color: '#fff', // 节点标签颜色
                    fontSize: titleFontSize * 0.5 // 节点标签字体大小
                },
                edgeLabel: { // 添加连接线标签配置
                    show: true,
                    formatter: function(params) { return params.data.name || ''; }, // 显示连接线的 name
                    fontSize: titleFontSize * 0.4,
                    color: '#ccc'
                },
                nodes: [], // 将由 updataChartData 填充
                links: [], // 将由 updataChartData 填充
                lineStyle: {
                    opacity: 0.9,
                    width: 4,
                    curveness: 0
                },
                // symbolSize 已在 JSON 中为每个节点分别定义，或此处设置一个统一的默认值
                // symbolSize: 40, // 统一的默认节点大小，如果JSON中没有则采用此值
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: [4, 8],
                emphasis: { // 高亮状态
                    focus: 'adjacency',
                    lineStyle: {
                        width: 6
                    }
                }
            }
        ]
    };
    chartInstance.setOption(option);
}
const updataChartData = () => {
    console.log('Entering updataChartData. allData for topology:', JSON.stringify(allData.value)); // 诊断日志3
    if (allData.value && allData.value.nodes && allData.value.links) {
        console.log('Data for ECharts topology - nodes:', JSON.stringify(allData.value.nodes)); // 诊断日志4
        console.log('Data for ECharts topology - links:', JSON.stringify(allData.value.links)); // 诊断日志5
        const option = {
            series: [{
                // name: '微电网拓扑', // series的name已在updataChart中定义
                // type: 'graph', // type也已在updataChart中定义
                // layout: 'none', // layout也已在updataChart中定义
                nodes: allData.value.nodes.map(node => {
                    // 将节点类型映射到 category 索引
                    let categoryIndex = -1;
                    const nodeTypeLower = node.type ? node.type.toLowerCase() : '';

                    if (nodeTypeLower === 'grid') categoryIndex = 0;
                    else if (nodeTypeLower === 'bus_ac') categoryIndex = 1;
                    else if (nodeTypeLower === 'generation_pv') categoryIndex = 2;
                    else if (nodeTypeLower === 'storage_battery') categoryIndex = 3;
                    else if (nodeTypeLower === 'load_fixed') categoryIndex = 4;
                    // 对于其他未明确列出的类型，可以尝试更通用的匹配
                    else {
                       categoryIndex = categories.findIndex(cat => nodeTypeLower.includes(cat.name.toLowerCase().replace(/\s+/g, '_')));
                       if (categoryIndex === -1) categoryIndex = 0; // 默认分配到第一个类别或一个“其他”类别
                    }
                    
                    return {
                        ...node,
                        category: categoryIndex,
                        symbolSize: node.symbolSize || 40,
                        itemStyle: node.itemStyle || (categories[categoryIndex] ? categories[categoryIndex].itemStyle : undefined)
                    };
                }),
                links: allData.value.links.map(link => {
                    return {
                        ...link,
                        lineStyle: link.lineStyle || { color: '#aaa', width: 2 }
                    };
                })
            }]
        };
        chartInstance.setOption(option);
        console.log('ECharts option set in updataChartData for topology'); // 诊断日志6
    } else {
        console.warn('updataChartData for topology: allData, nodes, or links are not valid. Chart data not updated.'); // 诊断日志7
    }
}

const allData = ref(null) // 初始化为 null，因为将直接存储对象
// 移除 seriesArr 的定义
const getData = async () => {
    const res = await useRequest('/map/microgrid_topology') // 移除 .json 后缀，让 useRequest 处理
    console.log('Response from useRequest for topology:', res); // 诊断日志1
    allData.value = res;
    console.log('allData after assignment for topology:', JSON.stringify(allData.value)); // 诊断日志2
    // 确保在 updataChart 之后调用 updataChartData，因为 updataChart 会初始化 series
    // 或者确保 updataChartData 能够处理 series 未被 updataChart 初始化的情况
    // 当前 updataChart 已经初始化了 series 结构，所以直接调用 updataChartData 是安全的
    updataChartData(); // 确保在获取数据后调用
}

const screenAdapter = () => {
    // updataChart() // 从此处移除，以避免重置数据
    chartInstance.resize()
}

onMounted(() => {
    initChart()     // 1. 初始化实例
    updataChart()   // 2. 设置基础配置 (包括 series 骨架和响应式字体)
    getData()       // 3. 获取数据并填充 series (调用 updataChartData)
    screenAdapter() // 4. 初始resize (主要为了确保图表尺寸正确)
    window.addEventListener('resize', screenAdapter)
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter)
})
defineExpose({
    screenAdapter // screenAdapter 现在只调用 resize
})
</script>

<template>
    <div class="map_container">
        <div class="map_chart" ref="map_chart"> {/* 移除 @dblclick="updataChart" */}

        </div>
    </div>
</template>

<style scoped>
.map_container {
    background-color: rgba(10, 25, 47, 0.75);
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.map_chart {
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>