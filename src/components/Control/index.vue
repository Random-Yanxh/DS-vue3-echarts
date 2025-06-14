<script setup>
import { computed } from 'vue'; // ref is no longer needed directly for modes/selectedModeId here
import { useModeStore } from '@/stores/modeStore';

const modeStore = useModeStore();

// modes and selectedModeId are now primarily managed by the store.
// We can use computed properties to access them if needed for the template,
// or directly use store properties in the template.

const currentDescription = computed(() => {
  return modeStore.selectedMode ? modeStore.selectedMode.description : '请选择一个工况模式。';
});

const selectMode = (modeId) => {
  modeStore.setSelectedMode(modeId);
  // console.log("Selected mode via store:", modeId); // Logging can be kept or removed
};
</script>

<template>
    <div class="control_panel_container">
        <div class="title">▎运行模式控制</div>
        <div class="modes_button_group">
            <button 
                v-for="mode in modeStore.modesConfig"
                :key="mode.id"
                class="mode_button"
                :class="{ active: modeStore.selectedModeId === mode.id }"
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