<script setup>
import { ref, inject, onMounted, onBeforeUnmount } from 'vue';
import useRequest from '@/composables/useRequest'
const echarts = inject('echarts')
const map_chart = ref(null)
let chartInstance = null
let resizeObserver = null;

// 将 categories 定义移到这里，使其在 updataChart 和 updataChartData 中都可访问
const categories = [
    { name: '电网', itemStyle: { color: '#4A90E2' } },          // type 'grid'
    { name: '600V交流母线', itemStyle: { color: '#7ED321' } },    // type 'bus_ac'
    { name: '光伏发电', itemStyle: { color: '#FFD700' } },    // type 'generation_pv'
    { name: '风力发电', itemStyle: { color: '#50E3C2' } },    // type 'generation_wind' (新增)
    { name: '蓄电池', itemStyle: { color: '#FF9800' } },    // type 'storage_battery'
    { name: '固定负荷', itemStyle: { color: '#F5A623' } },    // type 'load_fixed'
    { name: '充电桩', itemStyle: { color: '#BD10E0' } },      // type 'charging_station' (新增)
    { name: '氢储能', itemStyle: { color: '#00BCD4' } },    // type 'storage_hydrogen' (新增)
];
const initChart = () => {
    chartInstance = echarts.init(map_chart.value, 'chalk')
    // 移除地图点击事件
}

// 移除 getAreaData 函数

const updataChart = () => {
    const titleFontSize = map_chart.value.offsetWidth / 100 * 3.6;
    // categories 常量已移至外部
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
                    const data = params.data;
                    let tooltipText = `<strong style="color: ${params.color};">${data.name}</strong>`;
                    tooltipText += `<br/>类型: ${data.type_display || data.type}`; // 使用 type_display (后续添加)
                    if (data.status) tooltipText += `<br/>状态: ${data.status}`;
                    
                    // 根据不同类型显示特定信息
                    if (data.type === 'grid') {
                        // 电网状态数据中去掉“交换功率”
                    } else if (data.type === 'bus_ac' && data.voltage !== undefined) {
                        tooltipText += `<br/>电压: ${data.voltage} V`;
                    } else if (data.type === 'generation_pv') {
                        if (data.currentPower !== undefined) tooltipText += `<br/>实时功率: ${data.currentPower} kW`;
                        if (data.dailyEnergy !== undefined) tooltipText += `<br/>日发电量: ${data.dailyEnergy} kWh`;
                        if (data.pm !== undefined) tooltipText += `<br/>最大功率Pm: ${data.pm} W`;
                        if (data.vmp !== undefined) tooltipText += `<br/>最大功率点电压Vmp: ${data.vmp} V`;
                        if (data.imp !== undefined) tooltipText += `<br/>最大功率点电流Imp: ${data.imp} A`;
                    } else if (data.type === 'generation_wind') {
                        if (data.currentPower !== undefined) tooltipText += `<br/>实时功率: ${data.currentPower} kW`;
                        if (data.dailyEnergy !== undefined) tooltipText += `<br/>日发电量: ${data.dailyEnergy} kWh`;
                        if (data.turbineType) tooltipText += `<br/>风机类型: ${data.turbineType}`;
                        if (data.ratedPower !== undefined) tooltipText += `<br/>额定功率: ${data.ratedPower} kW`;
                        if (data.maxTipSpeedRatio !== undefined) tooltipText += `<br/>最大叶尖速比: ${data.maxTipSpeedRatio}`;
                    } else if (data.type === 'storage_battery') {
                        if (data.soc !== undefined) tooltipText += `<br/>SOC: ${data.soc}%`;
                        if (data.power !== undefined) tooltipText += `<br/>充放功率: ${data.power} kW`;
                        if (data.ratedVoltage !== undefined) tooltipText += `<br/>额定电压: ${data.ratedVoltage} V`;
                        if (data.ratedCapacity !== undefined) tooltipText += `<br/>额定容量: ${data.ratedCapacity} Ah`;
                        if (data.initialSoc !== undefined) tooltipText += `<br/>初始SOC: ${data.initialSoc}%`;
                        if (data.responseTime !== undefined) tooltipText += `<br/>响应时间: ${data.responseTime} s`;
                    } else if (data.type === 'load_fixed' && data.currentPower !== undefined) {
                        tooltipText += `<br/>负荷功率: ${data.currentPower} kW`;
                    } else if (data.type === 'charging_station') {
                        if (data.currentPower !== undefined) tooltipText += `<br/>实时功率: ${data.currentPower} kW`;
                        if (data.ratedVoltage !== undefined) tooltipText += `<br/>额定电压: ${data.ratedVoltage} V`;
                        if (data.ratedCapacity !== undefined) tooltipText += `<br/>额定容量: ${data.ratedCapacity} Ah`;
                        if (data.initialSoc !== undefined) tooltipText += `<br/>初始SOC: ${data.initialSoc}%`;
                        if (data.responseTime !== undefined) tooltipText += `<br/>响应时间: ${data.responseTime} s`;
                    }
                    // 可以添加更多通用属性的显示
                    // if (data.voltage !== undefined && data.type !== 'bus_ac') tooltipText += `<br/>电压: ${data.voltage} V`;

                    return tooltipText;
                } else if (params.dataType === 'edge') {
                    const data = params.data;
                    let tooltipText = `<strong>${data.name || data.type}</strong>`;
                    if (data.powerFlow !== undefined) {
                        tooltipText += `<br/>功率流: ${data.powerFlow} kW`;
                    }
                    // 可以添加线路的其他信息，如电压等级等
                    return tooltipText;
                }
                return params.name;
            }
        },
        legend: [{ // 添加图例配置
            data: categories.map(function (a) { return a.name; }),
            bottom: 20,
            left: 'center',
            orient: 'horizontal',
            itemWidth: titleFontSize * 0.7, // 调整大小
            itemHeight: titleFontSize * 0.7, // 调整大小
            icon: 'rect', // 可以根据喜好选择 'circle', 'roundRect', 'rect' 等
            itemGap: 15,
            selectedMode: 'multiple', // 允许通过图例筛选显示
            textStyle: {
                fontSize: titleFontSize * 0.65, // 调整大小
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
                // 节点标签统一样式
                label: {
                    show: true,
                    position: 'bottom',
                    formatter: function(params) {
                        const data = params.data;
                        let text = data.name;
                        // 可以在此根据节点类型添加额外信息到标签，但tooltip中已有，保持标签简洁
                        // if (data.type === 'bus_ac' && data.voltage) {
                        //     text += `\n${data.voltage}V`;
                        // } else if (data.type === 'generation_pv' && data.currentPower !== undefined) {
                        //     text += `\n${data.currentPower}kW`;
                        // }
                        return text;
                    },
                    color: '#fff', // 节点标签颜色
                    fontSize: titleFontSize * 0.6 // 节点标签字体大小
                },
                edgeLabel: { // 添加连接线标签配置
                    show: true,
                    formatter: function(params) { return params.data.name || ''; }, // 显示连接线的 name
                    // formatter: function(params) { // 更详细的连接线标签
                    //     let text = params.data.name || '';
                    //     if (params.data.powerFlow !== undefined) {
                    //         text += `\n${params.data.powerFlow} kW`;
                    //     }
                    //     return text;
                    // },
                    fontSize: titleFontSize * 0.5, // 略微调大
                    color: '#ccc'
                },
                nodes: [], // 将由 updataChartData 填充
                links: [], // 将由 updataChartData 填充
                lineStyle: {
                    opacity: 0.9,
                    width: 4, // 默认主干线宽度，具体可在updataChartData中根据level调整
                    curveness: 0 // 直线
                },
                // symbolSize 已在 JSON 中为每个节点分别定义，或此处设置一个统一的默认值
                // symbolSize: 40, // 统一的默认节点大小，如果JSON中没有则采用此值
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: [4, 8], // 可根据线条宽度调整
                emphasis: { // 高亮状态
                    focus: 'adjacency', // 高亮相邻节点和边
                    scale: true, // 节点放大
                    lineStyle: {
                        width: 6 // 高亮时连接线变粗
                    },
                    label: {
                        fontSize: titleFontSize * 0.7 // 高亮时标签字体略大
                    },
                    itemStyle: { // 节点高亮样式
                        borderColor: '#fff',
                        borderWidth: 2,
                        shadowBlur: 5,
                        shadowColor: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        ]
    };
    chartInstance.setOption(option);
}

// 辅助函数：获取节点类型对应的显示名称
const getNodeTypeDisplay = (type) => {
    // const category = categories.find(cat => cat.name.toLowerCase().includes(type.replace(/_/g, '').toLowerCase()));
    if (type === 'grid') return '公共电网';
    if (type === 'bus_ac') return '600V交流母线';
    if (type === 'generation_pv') return '光伏发电';
    if (type === 'generation_wind') return '风力发电';
    if (type === 'storage_battery') return '蓄电池';
    if (type === 'load_fixed') return '固定负荷';
    if (type === 'charging_station') return '充电桩'; // 新增
    if (type === 'storage_hydrogen') return '氢储能系统'; // 新增
    return type; // 默认返回原始类型
};

const updataChartData = () => {
    console.log('Entering updataChartData. allData for topology:', JSON.stringify(allData.value)); // 诊断日志3
    if (allData.value && allData.value.nodes && allData.value.links) {
        console.log('Data for ECharts topology - nodes:', JSON.stringify(allData.value.nodes)); // 诊断日志4
        console.log('Data for ECharts topology - links:', JSON.stringify(allData.value.links)); // 诊断日志5
        
        const baseSymbolSize = map_chart.value ? map_chart.value.offsetWidth / 100 * 2.2 : 40; // 响应式基础节点大小

        const option = {
            series: [{
                // name: '微电网拓扑', // series的name已在updataChart中定义
                // type: 'graph', // type也已在updataChart中定义
                // layout: 'none', // layout也已在updataChart中定义
                nodes: allData.value.nodes.map(node => {
                    let categoryIndex = -1;
                    const nodeTypeLower = node.type ? node.type.toLowerCase() : '';
                    let symbolPath = node.symbol; // 默认使用数据中的symbol
                    let finalSymbolSize = node.symbolSize || baseSymbolSize; // 默认基础大小
                    let itemStyleOverwrite = {}; // 用于覆盖或添加itemStyle属性

                    // 根据类型分配 categoryIndex 和 symbol
                    if (nodeTypeLower === 'grid') {
                        categoryIndex = 0; // 电网
                        symbolPath = 'image:///icons/gridmap/grid.svg';
                        finalSymbolSize = baseSymbolSize * 1.6; // 电网节点稍大
                    } else if (nodeTypeLower === 'bus_ac') {
                        categoryIndex = 1; // 600V交流母线
                        symbolPath = 'rect';
                        finalSymbolSize = [baseSymbolSize * 3, baseSymbolSize * 0.6]; // 母线长条形
                    } else if (nodeTypeLower === 'generation_pv') {
                        categoryIndex = 2; // 光伏发电
                        symbolPath = 'image:///icons/gridmap/pv.svg';
                        finalSymbolSize = baseSymbolSize * 1.3;
                    } else if (nodeTypeLower === 'generation_wind') {
                        categoryIndex = 3; // 风力发电
                        symbolPath = 'image:///icons/gridmap/windpower.svg';
                        finalSymbolSize = baseSymbolSize * 1.4;
                    } else if (nodeTypeLower === 'storage_battery') {
                        categoryIndex = 4; // 蓄电池
                        symbolPath = 'image:///icons/gridmap/battery.svg';
                        finalSymbolSize = baseSymbolSize * 1.3;
                    } else if (nodeTypeLower === 'load_fixed') {
                        categoryIndex = 5; // 固定负荷
                        symbolPath = 'image:///icons/gridmap/load.svg';
                        finalSymbolSize = baseSymbolSize * 1.2;
                    } else if(nodeTypeLower === 'charging_station') {
                        categoryIndex = 6; // 充电桩
                        symbolPath = 'image:///icons/gridmap/charging_station.svg';
                        finalSymbolSize = baseSymbolSize * 1.2
                    } else if (nodeTypeLower === 'storage_hydrogen') {
                        categoryIndex = 7; // 氢储能
                        symbolPath = 'image:///icons/gridmap/hydragen.svg';
                        finalSymbolSize = baseSymbolSize * 1.3;
                    }
                    
                    // 根据节点状态调整样式 (示例)
                    // 假设 node.status: 'ok', 'warning', 'offline', 'fault'
                    if (node.status === 'offline' || node.status === 'fault') {
                        itemStyleOverwrite.borderColor = 'red';
                        itemStyleOverwrite.borderWidth = 2;
                        // itemStyleOverwrite.color = '#777'; // 可以让节点变灰暗
                        itemStyleOverwrite.opacity = 0.6;
                    } else if (node.status === 'warning') {
                        itemStyleOverwrite.borderColor = 'orange';
                        itemStyleOverwrite.borderWidth = 2;
                    }

                    return {
                        ...node,
                        category: categoryIndex,
                        symbol: symbolPath,
                        symbolSize: finalSymbolSize,
                        itemStyle: {
                            ...(categories[categoryIndex] ? categories[categoryIndex].itemStyle : {}), // 应用类别颜色
                            ...(node.itemStyle || {}), // 应用数据中定义的节点特定样式
                            ...itemStyleOverwrite // 应用状态相关的样式覆盖
                        },
                        type_display: getNodeTypeDisplay(node.type) // 添加友好类型名称
                    };
                }),
                links: allData.value.links.map(link => {
                    let defaultLinkStyle = {
                        color: '#a0a0a0', // 默认分支连接线颜色
                        width: 2,      // 默认分支连接线宽度
                        opacity: 0.7
                    };

                    // 根据 link.level 或其他属性区分主次干线 (假设数据中有 link.level: 'primary' | 'secondary')
                    if (link.level === 'primary') {
                        defaultLinkStyle.width = 4;
                        defaultLinkStyle.color = '#66b3ff'; // 主干线颜色
                        defaultLinkStyle.opacity = 0.9;
                    } else if (link.level === 'secondary') {
                         defaultLinkStyle.width = 2;
                         defaultLinkStyle.color = '#88ddaa'; // 次级干线颜色示例
                         defaultLinkStyle.opacity = 0.8;
                    }
                    // 如果数据中link本身定义了lineStyle，则会覆盖这里的默认值
                    const finalLinkStyle = { ...defaultLinkStyle, ...link.lineStyle };


                    let effectOptions = { show: false };
                    // 为功率流较大的线路或特定类型的线路添加特效
                    if (Math.abs(link.powerFlow || 0) > 50 || link.level === 'primary') {
                        effectOptions = {
                            show: true,
                            period: 6, // 动画周期，越小越快
                            trailLength: 0.5, // 轨迹长度 0-1
                            color: finalLinkStyle.color || '#fff', // 特效颜色跟随线条或为白色
                            symbolSize: Math.max(2, finalLinkStyle.width / 2), // 特效大小与线条粗细关联
                            symbol: 'arrow',
                            loop: true
                        };
                    }

                    return {
                        ...link,
                        lineStyle: finalLinkStyle,
                        effect: effectOptions
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
    const res = await useRequest('/gridmap/microgrid_topology') // 移除 .json 后缀，让 useRequest 处理
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
    if (chartInstance && map_chart.value) { // Add checks
        chartInstance.resize()
    }
}

onMounted(() => {
    initChart()     // 1. 初始化实例
    updataChart()   // 2. 设置基础配置 (包括 series 骨架和响应式字体)
    getData()       // 3. 获取数据并填充 series (调用 updataChartData)
    screenAdapter() // 4. 初始resize (主要为了确保图表尺寸正确)
    window.addEventListener('resize', screenAdapter)

    // Setup ResizeObserver
    if (map_chart.value) {
        resizeObserver = new ResizeObserver(() => {
            screenAdapter();
        });
        resizeObserver.observe(map_chart.value);
    }

})
onBeforeUnmount(() => {
    window.removeEventListener('resize', screenAdapter)

    // Cleanup ResizeObserver
    if (resizeObserver && map_chart.value) {
        resizeObserver.unobserve(map_chart.value);
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

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