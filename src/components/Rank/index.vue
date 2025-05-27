<script setup>
import { ref, onMounted } from 'vue';
import useRequest from '@/composables/useRequest'

// 保留 script setup 标签，移除原有数据获取逻辑
</script>

<template>
    <div class="console_container">
        <div class="button-row">
            <button class="console-button">开始</button>
            <button class="console-button">停止</button>
        </div>
        <div class="button-row">
            <button class="console-button">并网-离网仿真</button>
            <button class="console-button">离网-并网仿真</button>
        </div>
    </div>
</template>

<style scoped>
.console_container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(10, 25, 47, 0.75);
    padding: 20px;
    box-sizing: border-box;
}

.button-row {
    display: flex;
    justify-content: center;
    margin-bottom: 20px; /* 行间距 */
}

.button-row:last-child {
    margin-bottom: 0;
}

.console-button {
    background-color: #102a4c;
    color: #64ffda;
    border: 1px solid #64ffda;
    padding: 10px 20px;
    margin: 0 10px; /* 按钮间距 */
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Arial', sans-serif; /* 指定一个清晰的无衬线字体 */
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.console-button:hover {
    background-color: #173d6e;
    border-color: #88fff1; /* 鼠标悬停时边框颜色加亮 */
}
</style>