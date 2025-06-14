<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useModeStore } from '@/stores/modeStore';

const modeStore = useModeStore();

const gaugeConfigurations = [
  { id: 1, name: '蓄电池SOC', unit: '%', fileName: 'BatteryLog_SOC_pct', defaultValue: 0 },
  { id: 2, name: '充电桩SOC', unit: '%', fileName: 'EVLog_SOC_pct', defaultValue: 0 },
  { id: 3, name: '电网频率', unit: 'Hz', fileName: 'GridLog_f', defaultValue: 50 },
];

const isPlaying = ref(false);
const panelSimulationClock = ref(0.00); 

const gaugeData = ref(
  gaugeConfigurations.map(config => ({
    ...config,
    fullData: [],       
    currentIndex: 0,    
    displayValue: config.defaultValue, 
    displayTime: panelSimulationClock.value.toFixed(2) + 's',   
  }))
);

let intervalId = null;
const UPDATE_INTERVAL_MS = 200; 
const SIMULATION_CLOCK_INCREMENT = 0.01; 
const DOWNSAMPLE_TARGET_STEP = 0.01; 

// --- Control Functions ---
const handlePause = () => {
  console.log("Panel: handlePause called.");
  isPlaying.value = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Panel: Animation paused, interval cleared.");
  }
};

const handleReset = () => {
  console.log("Panel: handleReset called.");
  handlePause(); 
  panelSimulationClock.value = 0.00;
  
  gaugeData.value = gaugeData.value.map(gauge => {
    const config = gaugeConfigurations.find(c => c.id === gauge.id);
    let initialValue = config.defaultValue;
    let initialTime = panelSimulationClock.value.toFixed(2) + 's';
    let initialIndex = 0;

    if (gauge.fullData && gauge.fullData.length > 0) {
      let pointToDisplay = gauge.fullData[0]; 
      for(let i = 0; i < gauge.fullData.length; i++) {
          if (gauge.fullData[i].time >= panelSimulationClock.value) {
              pointToDisplay = gauge.fullData[i];
              initialIndex = i;
              break;
          }
      }
      if(pointToDisplay) {
        initialValue = pointToDisplay.value;
      }
    }
    return {
      ...gauge, 
      currentIndex: initialIndex,
      displayValue: initialValue,
      displayTime: initialTime,
    };
  });
  console.log("Panel: Gauges reset.");
};

const advancePlaybackStep = () => {
  if (!isPlaying.value) return;

  panelSimulationClock.value = parseFloat((panelSimulationClock.value + SIMULATION_CLOCK_INCREMENT).toFixed(2));
  const currentSimTime = panelSimulationClock.value;
  let allGaugesPlaybackCompletedOrNoData = true;

  gaugeData.value = gaugeData.value.map(gauge => {
    const newGaugeState = { ...gauge };
    newGaugeState.displayTime = currentSimTime.toFixed(2) + 's';

    if (newGaugeState.fullData && newGaugeState.fullData.length > 0) {
      let bestMatchIndex = newGaugeState.currentIndex;
      for (let i = newGaugeState.currentIndex; i < newGaugeState.fullData.length; i++) {
        if (newGaugeState.fullData[i].time <= currentSimTime) {
          bestMatchIndex = i;
        } else {
          break; 
        }
      }
      
      const pointToDisplay = newGaugeState.fullData[bestMatchIndex];
      if (pointToDisplay) {
        newGaugeState.displayValue = pointToDisplay.value;
        newGaugeState.currentIndex = bestMatchIndex;
      }

      if (currentSimTime < newGaugeState.fullData[newGaugeState.fullData.length - 1].time) {
        allGaugesPlaybackCompletedOrNoData = false;
      }
    }
    return newGaugeState;
  });

  const gaugesWithData = gaugeData.value.filter(g => g.fullData && g.fullData.length > 0);
  if (gaugesWithData.length > 0 && allGaugesPlaybackCompletedOrNoData) {
     if (isPlaying.value) {
        handlePause();
        console.log("Panel: All gauge data series have been played according to panel simulation time.");
    }
  }
};

const handlePlay = () => {
  if (isPlaying.value) return;
  const gaugesThatCanPlay = gaugeData.value.filter(g => g.fullData && g.fullData.length > 0);
  if (gaugesThatCanPlay.length === 0) {
      console.log("Panel: No data loaded in any gauges to play. Aborting play.");
      return; 
  }
  const allDataSeriesFinishedByClock = gaugesThatCanPlay.every(gauge => 
    panelSimulationClock.value >= gauge.fullData[gauge.fullData.length - 1].time
  );
  if (allDataSeriesFinishedByClock) {
    handleReset(); 
  }
  isPlaying.value = true;
  console.log("Panel: Animation started. isPlaying:", isPlaying.value);
   gaugeData.value = gaugeData.value.map(gauge => {
      const newGaugeState = { ...gauge };
      newGaugeState.displayTime = panelSimulationClock.value.toFixed(2) + 's';
      if (newGaugeState.fullData && newGaugeState.fullData.length > 0) {
          let bestMatchIndex = 0; 
          for (let i = 0; i < newGaugeState.fullData.length; i++) {
            if (newGaugeState.fullData[i].time <= panelSimulationClock.value) {
              bestMatchIndex = i;
            } else {
              break;
            }
          }
          const pointToDisplay = newGaugeState.fullData[bestMatchIndex];
          if(pointToDisplay) {
            newGaugeState.displayValue = pointToDisplay.value;
            newGaugeState.currentIndex = bestMatchIndex; 
          }
      }
      return newGaugeState;
  });
  if (!intervalId) {
    intervalId = setInterval(advancePlaybackStep, UPDATE_INTERVAL_MS);
  }
};

// --- Async Downsampling Function ---
const asyncDownsample = (rawData, targetStep, chunkSize = 20000) => { // chunkSize can be tuned
  return new Promise(resolve => {
    if (!rawData || rawData.length === 0) {
      resolve([]);
      return;
    }
    const downsampled = [];
    let lastIncludedTime = -Infinity;
    let currentIndex = 0;

    if (rawData[0].time >= 0) {
      downsampled.push(rawData[0]);
      lastIncludedTime = rawData[0].time;
      currentIndex = 1;
    }

    function processChunk() {
      const processUntilIndex = Math.min(currentIndex + chunkSize, rawData.length);
      for (let i = currentIndex; i < processUntilIndex; i++) {
        const point = rawData[i];
        if (point.time >= lastIncludedTime + targetStep) {
          downsampled.push(point);
          lastIncludedTime = point.time;
        }
      }
      currentIndex = processUntilIndex;

      if (currentIndex < rawData.length) {
        requestAnimationFrame(processChunk); 
      } else {
        if (downsampled.length === 0 && rawData.length > 0) {
          downsampled.push(rawData[rawData.length - 1]);
        }
        resolve(downsampled);
      }
    }
    requestAnimationFrame(processChunk); 
  });
};

// --- Data Fetching and Watcher ---
const fetchDataForGauge = async (gaugeConfig, folderPath) => {
  if (!gaugeConfig.fileName || !folderPath) {
    console.error(`Panel: Missing fileName or folderPath for gauge ${gaugeConfig.name}`);
    return [];
  }
  const filePath = `${folderPath}${gaugeConfig.fileName}.json`;
  console.log(`Panel: Attempting to fetch data for ${gaugeConfig.name} from: ${filePath}`);
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(`Panel: HTTP error! Status: ${response.status}, StatusText: ${response.statusText} for ${filePath}`);
      throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
    }
    const jsonData = await response.json(); 
    console.log(`Panel: Successfully fetched raw data for ${gaugeConfig.name} from ${filePath}. Items: ${jsonData.length}`);
    return jsonData; 
  } catch (error) {
    console.error(`Panel: Error fetching or parsing data for ${gaugeConfig.name} from ${filePath}:`, error);
    return []; 
  }
};

const loadAllGaugeDataForMode = async () => {
  const folderPath = modeStore.selectedModeFolderPath;
  if (!folderPath) {
    console.warn("Panel: modeStore.selectedModeFolderPath is not available yet for loadAllGaugeDataForMode.");
    return;
  }
  handlePause(); 
  panelSimulationClock.value = 0.00; 
  console.log(`Panel: Loading all gauge data for mode folder: ${folderPath}`);
  
  const newDataPromises = gaugeData.value.map(async (gauge) => {
    const config = gaugeConfigurations.find(c => c.id === gauge.id);
    const rawSeriesData = await fetchDataForGauge(config, folderPath);
    
    console.log(`Panel: Starting downsampling for ${config.name}, raw data length: ${rawSeriesData.length}`);
    const downsampledData = await asyncDownsample(rawSeriesData, DOWNSAMPLE_TARGET_STEP);
    console.log(`Panel: Finished downsampling for ${config.name}, downsampled length: ${downsampledData.length}`);

    let initialValue = config.defaultValue;
    let initialTime = panelSimulationClock.value.toFixed(2) + 's';
    let initialIndex = 0;

    if (downsampledData.length > 0) {
        let pointToDisplay = downsampledData[0];
        for(let i = 0; i < downsampledData.length; i++) {
            if (downsampledData[i].time >= panelSimulationClock.value) { 
                pointToDisplay = downsampledData[i];
                initialIndex = i;
                break;
            }
        }
        if(pointToDisplay) initialValue = pointToDisplay.value;
    }

    return {
      ...gauge,
      fullData: downsampledData, 
      currentIndex: initialIndex,
      displayValue: initialValue,
      displayTime: initialTime,
    };
  });
  gaugeData.value = await Promise.all(newDataPromises);
  console.log("Panel: gaugeData after loadAllGaugeDataForMode (dataLength refers to downsampled):", JSON.parse(JSON.stringify(gaugeData.value.map(g => ({id: g.id, name: g.name, dataLength: g.fullData.length, displayTime: g.displayTime})))));
};

watch(() => modeStore.selectedModeFolderPath, (newPath, oldPath) => {
    if (newPath && (newPath !== oldPath || gaugeData.value.some(g => g.fullData.length === 0 && g.fileName))) { 
        console.log(`Panel: Mode folder path changed to: ${newPath} or initial load needed. Reloading all gauge data.`);
        loadAllGaugeDataForMode();
    }
}, { immediate: true });


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
          <span class="gauge_value">{{ typeof item.displayValue === 'number' ? item.displayValue.toFixed(2) : item.displayValue }}</span>
          <span class="gauge_unit">{{ item.unit }}</span>
        </div>
        <div class="gauge_time_area">
          <span class="gauge_time_label">仿真时间:</span>
          <span class="gauge_time">{{ item.displayTime }}</span>
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
  padding: 10px; 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
  overflow: hidden; 
}

.gauge_name {
  font-size: clamp(13px, 2.2vw, 15px); 
  color: #a8b2d1;
  margin-bottom: 8px; 
}

.gauge_value_area {
  margin-bottom: 6px; 
}

.gauge_value {
  font-size: clamp(22px, 4.5vw, 30px); 
  font-weight: bold;
  color: #64ffda;
  margin-right: 5px;
}

.gauge_unit {
  font-size: clamp(13px, 2.2vw, 15px); 
  color: #a8b2d1;
}

.gauge_time_area {
  font-size: clamp(11px, 1.8vw, 13px); 
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
  gap: 10px; 
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
  background-color: #1c2b4a; 
  color: #4a5a7a; 
  cursor: not-allowed;
  box-shadow: none;
}
</style>