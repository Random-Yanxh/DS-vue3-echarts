<script setup>
import { ref, onUnmounted, readonly } from 'vue';

// Define initial state for reset, wrapped in readonly for safety
const INITIAL_GAUGE_DATA = readonly([
  { id: 1, value: 123.45, time: '0.00s', unit: 'kW', name: '蓄电池SOC' },
  { id: 2, value: 50.00, time: '0.00s', unit: 'Hz', name: '充电桩SOC' },
  { id: 3, value: 50.0, time: '0.00s', unit: 'Hz', name: '微电网频率' },
]);

const isPlaying = ref(false);
// Initialize gaugeData with a deep copy of the initial state
const gaugeData = ref(JSON.parse(JSON.stringify(INITIAL_GAUGE_DATA)));

let intervalId = null;
let simulationTimeCounter = 0;

const UPDATE_INTERVAL_MS = 200; // Updated to 0.2s 改这里控制跳变速度
const SIMULATION_TIME_INCREMENT_S = 0.01;

const updateSimulatedData = () => {
  simulationTimeCounter += SIMULATION_TIME_INCREMENT_S;
  const newTimeStr = simulationTimeCounter.toFixed(2) + 's';

  gaugeData.value = gaugeData.value.map(item => {
    let newValue;
    switch(item.unit) {
      case 'kW':
        newValue = parseFloat((100 + Math.random() * 50).toFixed(2));
        break;
      case 'Hz':
        newValue = parseFloat((49.95 + Math.random() * 0.1).toFixed(2));
        break;
      case 'V':
        newValue = parseFloat((218 + Math.random() * 4).toFixed(2));
        break;
      default:
        newValue = parseFloat((Math.random() * 200).toFixed(2));
    }
    return {
      ...item,
      value: newValue,
      time: newTimeStr,
    };
  });
};

const handlePlay = () => {
  if (isPlaying.value) return; // Prevent multiple intervals if already playing
  isPlaying.value = true;
  updateSimulatedData(); // Update immediately once on play
  intervalId = setInterval(updateSimulatedData, UPDATE_INTERVAL_MS);
};

const handlePause = () => {
  if (!isPlaying.value) return; // Do nothing if already paused
  isPlaying.value = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const handleReset = () => {
  isPlaying.value = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  simulationTimeCounter = 0;
  // Reset gaugeData to a deep copy of the initial state
  gaugeData.value = JSON.parse(JSON.stringify(INITIAL_GAUGE_DATA));
};

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <div class="panel_container">
    <h3 class="panel_title">▎关键指标仪表盘</h3>
    <div class="panel_content_main">
      <div class="gauge_item" v-for="item in gaugeData" :key="item.id">
        <div class="gauge_name">{{ item.name }}</div>
        <div class="gauge_value_area">
          <span class="gauge_value">{{ item.value.toFixed(2) }}</span>
          <span class="gauge_unit">{{ item.unit }}</span>
        </div>
        <div class="gauge_time_area">
          <span class="gauge_time_label">仿真时间:</span>
          <span class="gauge_time">{{ item.time }}</span>
        </div>
      </div>
    </div>
    <div class="panel_controls">
      <button @click="handlePlay" :disabled="isPlaying" class="control_button">启动</button>
      <button @click="handlePause" :disabled="!isPlaying" class="control_button">暂停</button>
      <button @click="handleReset" class="control_button">重置</button>
    </div>
  </div>
</template>

<style scoped>
.panel_container {
  width: 100%;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
  background-color: rgba(10, 25, 47, 0.75);
  color: #e6f7ff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
}

.panel_title {
  font-size: clamp(16px, 4vw, 20px);
  color: #64ffda;
  margin-bottom: 10px;
  text-shadow: 0 0 5px #64ffda;
  align-self: flex-start;
  padding-left: 5px;
  flex-shrink: 0;
}

.panel_content_main {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  overflow: hidden;
  gap: 10px;
}

.gauge_item {
  flex-basis: 0;
  flex-grow: 1;
  border: 1px solid #1e3a5f;
  background-color: rgba(19, 47, 76, 0.5);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
}

.gauge_name {
  font-size: clamp(14px, 2.5vw, 16px);
  color: #a8b2d1;
  margin-bottom: 10px;
}

.gauge_value_area {
  margin-bottom: 8px;
}

.gauge_value {
  font-size: clamp(24px, 5vw, 32px);
  font-weight: bold;
  color: #64ffda;
  margin-right: 5px;
}

.gauge_unit {
  font-size: clamp(14px, 2.5vw, 16px);
  color: #a8b2d1;
}

.gauge_time_area {
  font-size: clamp(12px, 2vw, 14px);
  color: #7f8c9b;
}

.gauge_time_label {
  margin-right: 5px;
}

.panel_controls {
  flex-shrink: 0;
  padding-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid #1e3a5f;
  margin-top: 10px;
  gap: 10px; /* Add gap between buttons */
}

.control_button {
  background-color: #233a5e;
  color: #e6f7ff;
  border: 1px solid #3a4a6a;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: clamp(13px, 2.2vw, 15px);
  transition: background-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
}

.control_button:hover {
  background-color: #3a4a6a;
  box-shadow: 0 0 8px rgba(100, 255, 218, 0.5);
}

.control_button:disabled {
  background-color: #1c2b4a; /* Darker when disabled */
  color: #4a5a7a; /* Dimmer text */
  cursor: not-allowed;
  box-shadow: none;
}

/* Specific active state for play/pause could be handled by :disabled or a class if needed,
   but the current :disabled logic should suffice.
   If specific styling for "active pause" or "active play" is needed,
   we can add classes based on isPlaying.
*/
</style>