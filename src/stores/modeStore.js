import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useModeStore = defineStore('mode', () => {
  const modesConfig = ref([
    { 
      id: 'island_running', 
      label: '孤岛运行', 
      folderName: 'MG_Islanded_Mode_json', 
      description: '光伏在0.7秒光照强度减小400W/m²，风机在0.5秒风速降低3m/s。此模式模拟微电网独立于主电网运行的情况，测试其在外部电网故障或不可用时的自主供电能力和稳定性。' 
    },
    { 
      id: 'island_to_grid', 
      label: '孤岛到并网', 
      folderName: 'MG_IslandToGrid_Switch_json', 
      description: '1秒时刻投入并网，仿真时间为2秒。此模式模拟微电网从独立运行状态平滑切换到与主电网并联运行的过程，检验同步、功率控制等并网关键技术。' 
    },
    { 
      id: 'grid_running', 
      label: '并网运行', 
      folderName: 'MG_GridConnected_Mode_json', 
      description: '光伏在0.7秒光照强度减小400W/m²，风机在0.5秒风速降低3m/s。此模式模拟微电网与主电网并联运行，可以进行电能交换，同时测试其在并网状态下应对内部可再生能源波动的能力。' 
    },
    { 
      id: 'planned_islanding', 
      label: '计划性脱网', 
      folderName: 'MG_GridToIsland_Mode_json', 
      description: '仿真总时间2秒，在1秒时从并网切换至离网。此模式模拟微电网按预定计划从主电网断开，转为独立运行的过程，例如在电网维护或为应对预期扰动时。' 
    },
    { 
      id: 'unplanned_islanding', 
      label: '非计划性脱网', 
      folderName: 'MG_GridToIsland_withoutplan_Mode_json', 
      description: '仿真总时间2秒，规定电网在1s时频率大幅降低。此模式模拟因主电网发生严重故障（如频率崩溃）导致微电网紧急、非计划地与主电网解列，并快速切换到孤岛运行以保障本地负荷。' 
    }
  ]);

  const selectedModeId = ref(modesConfig.value[0].id); // Default to first mode

  const selectedMode = computed(() => {
    return modesConfig.value.find(m => m.id === selectedModeId.value) || modesConfig.value[0];
  });

  const selectedModeFolderPath = computed(() => {
    // Assumes data folders are in public/data/
    return `/data/${selectedMode.value.folderName}/`;
  });
  
  function setSelectedMode(modeId) {
    if (modesConfig.value.some(m => m.id === modeId)) {
      selectedModeId.value = modeId;
      console.log(`ModeStore: Selected mode set to ${modeId}`);
    } else {
      console.warn(`ModeStore: Mode ID "${modeId}" not found. Defaulting to ${modesConfig.value[0].id}`);
      selectedModeId.value = modesConfig.value[0].id; // Fallback to default if provided ID is invalid
    }
  }

  return { 
    modesConfig, 
    selectedModeId, 
    selectedMode, 
    selectedModeFolderPath, 
    setSelectedMode 
  };
});