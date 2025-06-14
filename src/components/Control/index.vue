<script setup>
import { ref, computed } from 'vue';

const modes = ref([
  { 
    id: 'island_running', 
    label: '孤岛运行', 
    description: '此模式模拟微电网独立于主电网运行的情况，测试其在外部电网故障或不可用时的自主供电能力和稳定性。工况设定：光伏在0.7秒光照强度减小400W/m²，风机在0.5秒风速降低3m/s。' 
  },
  { 
    id: 'island_to_grid', 
    label: '孤岛到并网', 
    description: '此模式模拟微电网从独立运行状态平滑切换到与主电网并联运行的过程，检验同步、功率控制等并网关键技术。工况设定：1秒时刻投入并网，仿真总时间为2秒。' 
  },
  { 
    id: 'grid_running', 
    label: '并网运行', 
    description: '此模式模拟微电网与主电网并联运行，可以进行电能交换，同时测试其在并网状态下应对内部可再生能源波动的能力。工况设定：光伏在0.7秒光照强度减小400W/m²，风机在0.5秒风速降低3m/s。' 
  },
  { 
    id: 'planned_islanding', // Changed id for clarity
    label: '计划性脱网', 
    description: '此模式模拟微电网按预定计划从主电网断开，转为独立运行的过程，例如在电网维护或为应对预期扰动时。工况设定：仿真总时间2秒，在1秒时从并网切换至离网。' 
  },
  { 
    id: 'unplanned_islanding', // Changed id for clarity
    label: '非计划性脱网', 
    description: '此模式模拟因主电网发生严重故障（如频率大幅降低）导致微电网紧急、非计划地与主电网解列，并快速切换到孤岛运行以保障本地负荷。工况设定：仿真总时间2秒，规定电网在1秒时频率大幅降低。' 
  }
]);

const selectedModeId = ref(modes.value[0].id); // Default to the first mode

const currentDescription = computed(() => {
  const selected = modes.value.find(mode => mode.id === selectedModeId.value);
  return selected ? selected.description : '请选择一个工况模式。';
});

const selectMode = (modeId) => {
  selectedModeId.value = modeId;
  // Later, this will also involve global data transmission
  console.log("Selected mode:", modeId);
};
</script>

<template>
    <div class="control_panel_container">
        <div class="title">▎运行模式控制</div>
        <div class="modes_button_group">
            <button 
                v-for="mode in modes" 
                :key="mode.id"
                class="mode_button"
                :class="{ active: selectedModeId === mode.id }"
                @click="selectMode(mode.id)">
                {{ mode.label }}
            </button>
        </div>
        <div class="description_area">
            <p>{{ currentDescription }}</p>
        </div>
    </div>
</template>

<style scoped>
.control_panel_container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    /* justify-content: center; */ /* Align items to start for title */
    align-items: center;
    background-color: rgba(10, 25, 47, 0.75);
    padding: 20px;
    box-sizing: border-box;
    color: #e6f7ff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.title {
  font-size: clamp(16px, 4vw, 20px); /* Match Panel title style */
  color: #64ffda;
  margin-bottom: 20px; /* Increased margin for better separation */
  text-shadow: 0 0 5px #64ffda;
  align-self: flex-start; /* Align title to the left */
  padding-left: 5px;
}

.modes_button_group {
    display: flex;
    /* flex-wrap: wrap; */ /* Remove wrap to keep buttons in one line */
    justify-content: center;
    gap: 8px; /* Reduced gap */
    margin-bottom: 20px;
    width: 100%;
}

.mode_button {
    background-color: #102a4c;
    color: #64ffda;
    border: 1px solid #2a4a7c;
    padding: 6px 10px; /* Reduced padding */
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px; /* Reduced font size */
    transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.2s ease;
    flex: 1 1 0; /* Allow buttons to grow and shrink, distribute space */
    text-align: center;
    /* min-width: 0; */ /* Remove or set to 0 to allow shrinking */
    white-space: nowrap; /* Prevent text wrapping inside button */
    overflow: hidden;
    text-overflow: ellipsis; /* Show ellipsis if text is too long */
}

.mode_button:hover {
    background-color: #173d6e;
    border-color: #64ffda;
    transform: translateY(-2px); /* Slight lift on hover */
}

.mode_button.active {
    background-color: #64ffda;
    color: #0a192f; /* Dark text on active button */
    border-color: #64ffda;
    font-weight: bold;
    box-shadow: 0 0 10px rgba(100, 255, 218, 0.7);
}

.description_area {
    width: 100%;
    margin-top: 10px; /* Space above description */
    padding: 15px;
    background-color: rgba(19, 47, 76, 0.3); /* Slightly different background for description */
    border: 1px solid #1e3a5f;
    border-radius: 6px;
    min-height: 80px; /* Minimum height for the text area */
    font-size: clamp(13px, 2.2vw, 14px);
    color: #a8b2d1; /* Softer text color for description */
    line-height: 1.6;
    overflow-y: auto; /* Allow scrolling if description is long */
    flex-grow: 1; /* Allow description to take remaining space */
}

.description_area p {
    margin: 0;
}
</style>