<script setup>
import { ref, onMounted } from 'vue';
import useRequest from '@/composables/useRequest';

const chartData = ref([]);

const getData = async () => {
    try {
        let res = await useRequest('/seller');
        // 获取前6条数据，保持原始顺序
        chartData.value = res.slice(0, 6);
    } catch (error) {
        console.error("Failed to get seller data:", error);
        chartData.value = [
            { name: '数据加载失败', value: '-' },
        ];
    }
};

onMounted(() => {
    getData();
});

</script>

<template>
    <div class="seller_container">
        <h3 class="table-title">▎关键指标概览</h3>
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>指标名称</th>
                        <th>当前值</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="chartData.length === 0 && chartData[0]?.name !== '数据加载失败'">
                        <td colspan="2" class="no-data">正在加载数据...</td>
                    </tr>
                    <tr v-for="(item, index) in chartData" :key="index">
                        <td>{{ item.name }}</td>
                        <td>{{ item.value }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.seller_container {
    width: 100%;
    height: 100%;
    padding: 15px; /* 减少内边距以适应小屏幕 */
    box-sizing: border-box;
    background-color: #0a192f;
    color: #e6f7ff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    flex-direction: column;
    /* align-items: center; /* 移除全局居中，让标题和表格宽度100% */
}

.table-title {
    font-size: clamp(16px, 4vw, 20px); /* 使用clamp实现字体响应式 */
    color: #64ffda;
    margin-bottom: 15px; /* 减少边距 */
    text-shadow: 0 0 5px #64ffda;
    align-self: flex-start;
    padding-left: 5px; /* 微调标题位置 */
}

.table-wrapper {
    width: 100%;
    flex-grow: 1; /* 使表格包装器填充剩余空间 */
    overflow-y: auto; /* 当内容超出高度时显示垂直滚动条 */
    overflow-x: hidden; /* 防止不必要的水平滚动条 */
    max-height: calc(100% - 50px); /* 减去标题和一些边距的高度，确保滚动条出现时机合适 */
    border: 1px solid #102a4c; /* 给滚动区域一个边框，更明确 */
    border-radius: 4px;
}

/* 自定义滚动条样式 (可选, 增加科技感) */
.table-wrapper::-webkit-scrollbar {
    width: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
    background: #0a192f;
    border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
    background-color: #173d6e;
    border-radius: 4px;
    border: 2px solid #0a192f;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
    background-color: #64ffda;
}


.data-table {
    width: 100%;
    border-collapse: collapse;
    /* box-shadow: 0 0 15px rgba(0, 255, 255, 0.3); /* 阴影移到wrapper或取消 */
}

.data-table th,
.data-table td {
    border-bottom: 1px solid #1e3a5f; /* 只保留底部边框，更简洁 */
    padding: 10px 12px; /* 减少内边距 */
    text-align: left;
    font-size: clamp(12px, 2.5vw, 15px); /* 单元格字体响应式 */
    white-space: nowrap; /* 防止文本换行导致列宽问题，如果需要换行则移除 */
}
.data-table td:first-child {
     /* white-space: normal; /* 允许指标名称换行 */
     /* word-break: break-all; /* 如果名称过长，则强制换行 */
}


.data-table th {
    background-color: #102a4c;
    color: #64ffda;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky; /* 表头吸顶 */
    top: 0;
    z-index: 1;
}

.data-table tbody tr:nth-child(even) {
    background-color: #0e223a;
}

.data-table tbody tr:hover {
    background-color: #173d6e;
    color: #ffffff;
    cursor: default;
}

.data-table td:first-child {
    color: #a8b2d1;
    min-width: 100px; /* 给第一列一个最小宽度 */
}
.data-table td:last-child {
    font-weight: bold;
    color: #64ffda;
    text-align: right; /* 值靠右对齐 */
    min-width: 60px;
}

.no-data {
    text-align: center !important; /* 覆盖其他对齐 */
    color: #a8b2d1;
    padding: 20px;
    font-size: clamp(14px, 3vw, 16px);
}
</style>