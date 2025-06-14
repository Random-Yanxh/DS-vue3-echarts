# 项目指南：基于源网荷储一体化的可视化仿真平台前端

本文档旨在帮助开发人员理解本项目（Vue 3 + Vite + ECharts + Pinia）的结构、核心架构、数据流以及关键组件，以便进行后续的开发和维护。

## 1. 项目概述

-   **项目核心功能**: 提供一个可视化的前端界面，用于展示和模拟不同工况下微电网系统的各项数据指标和运行状态。
-   **主要技术栈**:
    -   **前端**: Vue 3, Vite, Pinia (用于状态管理), Vue Router, ECharts (用于数据可视化)。
    -   **CSS**: `normalize.css` 及自定义样式。
-   **当前数据交互模式**:
    -   **工况数据**: 主要从位于 `public/data/` 目录下的静态 JSON 文件中获取。每个预设的运行工况对应一个子文件夹，内含该工况下的各类设备和系统日志数据。
    -   **状态同步**: 通过 Pinia store ([`src/stores/modeStore.js`](src/stores/modeStore.js)) 全局管理和同步当前选定的运行工况模式。
    -   **数据加载**: 各图表和仪表盘组件监听工况模式的改变，动态构建文件路径，并使用 `fetch` API 异步加载对应的 JSON 数据。
    -   **WebSocket**: 项目中存在 [`src/utils/socket_service.js`](src/utils/socket_service.js)，但当前核心的图表数据加载已不依赖此 WebSocket 服务。其可能用于项目中其他实时通信功能（如有）。

## 2. 项目启动与构建

-   **环境要求**: Node.js (建议最新 LTS 版本), npm 或 yarn。
-   **依赖安装**:
    ```bash
    npm install
    ```
    或
    ```bash
    yarn install
    ```
-   **启动开发环境**:
    -   启动前端 Vite 开发服务器 (端口通常为 `5173` 或 Vite 自动选择的其他端口):
        ```bash
        npm run dev
        ```
    -   前端应用启动后，即可在浏览器中访问。
-   **（可选）启动后端 Koa 服务**:
    -   项目包含一个位于 `koa/` 目录的 Koa.js 后端服务。
        ```bash
        npm run server
        ```
    -   **注意**: 根据当前的架构调整，核心的图表和仪表盘数据已改为从 `public/data/` 目录下的静态 JSON 文件加载，不再强制依赖此 Koa 服务进行数据获取。此后端服务可能用于项目中其他 API 接口或辅助功能。
-   **生产环境构建**:
    ```bash
    npm run build
    ```
    构建产物将输出到 `dist` 目录。
-   **预览生产构建**:
    ```bash
    npm run preview
    ```

## 3. 目录结构详解

```
├── public/
│   ├── data/                     # 存放所有工况模式的静态JSON数据
│   │   ├── MG_Islanded_Mode_json/  # 示例：孤岛运行模式数据文件夹
│   │   │   ├── BatteryLog_SOC_pct.json
│   │   │   └── ... (其他数据文件)
│   │   ├── MG_IslandToGrid_Switch_json/
│   │   ├── MG_GridConnected_Mode_json/
│   │   ├── MG_GridToIsland_Mode_json/
│   │   └── MG_GridToIsland_withoutplan_Mode_json/
│   └── favicon.ico
├── src/
│   ├── App.vue                   # Vue 应用根组件
│   ├── main.js                   # Vue 应用初始化入口 (实例化 Vue, Pinia, Router)
│   ├── assets/                   # 静态资源 (图片, CSS, 字体, ECharts 主题)
│   ├── components/               # 可复用的 Vue 组件
│   │   ├── Control/index.vue     # 工况模式选择控制面板
│   │   ├── Graph/index.vue       # 通用 ECharts 折线图组件
│   │   ├── Indicators/index.vue  # (已改造为) ECharts 折线图组件
│   │   ├── Panel/index.vue       # 包含三个动态仪表盘的面板组件
│   │   ├── Gridmap/index.vue     # 微电网拓扑图组件
│   │   └── ... (其他组件)
│   ├── router/                   # Vue Router 配置
│   │   └── index.js
│   ├── stores/                   # Pinia 状态管理
│   │   └── modeStore.js          # 核心：管理当前运行工况模式
│   ├── utils/                    # 前端通用工具函数
│   │   └── socket_service.js     # WebSocket 服务封装 (当前图表数据不依赖)
│   └── views/                    # 页面级视图组件
│       └── HomeView.vue          # 主仪表盘视图
├── file_name_list.txt            # 数据文件名及其含义的对照表 (重要参考)
├── package.json                  # 项目依赖和脚本
└── vite.config.js                # Vite 构建配置文件
```

## 4. 核心架构：工况切换与数据动态加载

本项目的核心交互逻辑围绕着由 [`src/components/Control/index.vue`](src/components/Control/index.vue) 组件控制的**运行工况模式切换**，以及各可视化组件（图表、仪表盘）对此变化的响应和数据的动态加载。

### 4.1. Pinia 状态管理 (`src/stores/modeStore.js`)
-   **`modesConfig`**: 一个包含所有预定义工况模式配置的数组。每个工况对象通常包含：
    -   `id`: 唯一标识符 (例如, `'island_running'`)。
    -   `label`: 在 `Control` 组件按钮上显示的文本 (例如, "孤岛运行")。
    -   `description`: 该工况的详细文字说明。
    -   `folderName`: 对应在 `public/data/` 目录下的数据子文件夹名称 (例如, `MG_Islanded_Mode_json`)。
-   **`selectedModeId`**: 一个 `ref`，存储当前被选中的工况 `id`。
-   **`selectedMode`**: 一个 `computed` 属性，根据 `selectedModeId` 返回当前选中工况的完整配置对象。
-   **`selectedModeFolderPath`**: 一个 `computed` 属性，根据 `selectedMode.folderName` 动态生成当前工况数据文件夹的URL相对路径 (例如, `/data/MG_Islanded_Mode_json/`)。
-   **`setSelectedMode(modeId)`**: 一个 action，用于更新 `selectedModeId`，由 `Control` 组件调用。

### 4.2. `Control` 组件
-   从 `modeStore` 获取 `modesConfig` 来渲染五个工况选择按钮。
-   按钮的激活状态绑定到 `modeStore.selectedModeId`。
-   点击按钮时，调用 `modeStore.setSelectedMode(mode.id)` 来更新全局选中的工况。
-   下方的描述区域显示 `modeStore.selectedMode.description`。

### 4.3. 数据消费组件 (`Graph`, `Indicators`, `Panel`)
这些组件采用统一模式来响应工况变化并加载数据：
1.  **注入 Store**: `const modeStore = useModeStore();`
2.  **监听变化**: 使用 `watch` 或 `watchEffect` 监听 `modeStore.selectedModeFolderPath` (以及组件内部可能有的其他数据选择器，如 `Graph` 组件的模块/参数选择)。
3.  **构建文件路径**: 当监听到工况变化时，组件会结合 `modeStore.selectedModeFolderPath` 和自身配置所需的数据文件名 (例如，`Graph` 组件从其内部的 `dataTypesConfig` 获取文件名，`Panel` 组件从其 `gaugeConfigurations` 获取文件名) 来构建一个完整的 JSON 文件 URL。
    -   数据文件名参考项目根目录下的 [`file_name_list.txt`](file_name_list.txt)。
    -   例如路径: `/data/MG_Islanded_Mode_json/BatteryLog_SOC_pct.json`
4.  **加载数据**: 使用 `fetch(filePath).then(res => res.json())` 异步加载数据。
5.  **数据格式**: 加载到的 JSON 数据是形如 `[ { "time": 0, "value": 10 }, ... ]` 的对象数组。
6.  **数据处理与渲染**:
    -   **`Graph.vue` / `Indicators.vue`**: 将加载的数据转换为 ECharts 需要的格式并更新图表。其内部的 `dataTypesConfig` 对象是关键，它将组件内的模块/参数选择映射到具体的数据文件名和图表显示配置（如标题、Y轴名称等）。
    -   **`Panel.vue`**: 为其三个仪表盘分别加载指定的数据文件。特别地，它包含一个**异步分块降采样**逻辑，用于处理从JSON文件加载的大量原始数据点（可能高达15万个），生成一个时间步长约为0.01秒的较稀疏数据序列。动画播放（启动、暂停、重置）基于这个降采样后的数据和一个独立的0.01秒步进的“显示用仿真时钟”进行。

## 5. 二次开发指南

### 5.1. 添加新的图表/仪表盘组件
1.  创建新的 `.vue` 组件在 `src/components/` 目录下。
2.  如果需要根据全局工况动态加载数据：
    *   在组件的 `<script setup>` 中导入并使用 `useModeStore`。
    *   参考 `Graph.vue` 或 `Panel.vue` 的实现，设置 `watch` 或 `watchEffect` 来监听 `modeStore.selectedModeFolderPath`。
    *   定义组件需要加载的数据文件名（参考 [`file_name_list.txt`](file_name_list.txt)）。
    *   实现 `fetch` 逻辑来加载和处理数据。
3.  在父组件（如 [`src/views/HomeView.vue`](src/views/HomeView.vue)）中引入并使用新组件，并调整布局。

### 5.2. 添加新的运行工况模式
1.  在 `public/data/` 目录下创建一个新的子文件夹，以该工况模式的标识符命名（例如, `MG_New_Mode_json`）。
2.  将该工况模式对应的所有JSON数据文件（遵循 [`file_name_list.txt`](file_name_list.txt) 的命名规范）放入此新文件夹。
3.  打开 [`src/stores/modeStore.js`](src/stores/modeStore.js) 文件。
4.  在 `modesConfig` ref 数组中，添加一个新对象来描述这个新工况，包括 `id`, `label` (按钮文本), `description` (详细说明), 和 `folderName` (对应刚创建的文件夹名)。

### 5.3. 修改或添加数据系列
1.  **更新数据文件**: 在相应的 `public/data/MODE_FOLDER/` 目录下添加或修改 JSON 文件。确保文件内容格式为 `[ { "time": ..., "value": ... }, ... ]`。
2.  **更新 `file_name_list.txt`**: 如果是新的数据系列，在此文件中添加一行描述其文件名和含义。
3.  **更新组件配置**:
    *   对于 `Graph.vue` 和 `Indicators.vue`：如果新数据系列需要在这些图表的下拉菜单中可选，或者现有选择需要映射到新的文件名，请更新它们各自内部的 `dataTypesConfig` 对象。确保 `chartName` 对应新的文件名（不含 `.json` 后缀），并更新 `text`, `yAxisName`, `seriesName`。可能还需要调整 `moduleOptions` 或 `parameterOptions`。
    *   对于 `Panel.vue`：如果新数据系列是用于仪表盘的，请更新其内部的 `gaugeConfigurations` 数组，修改对应仪表盘的 `fileName`, `name`, `unit`。

## 6. 注意事项
-   **数据文件路径**: 所有工况的 JSON 数据文件必须放置在 `public/data/` 目录下的对应工况子文件夹中。前端 `fetch` 的路径是相对于 `public` 目录的。
-   **文件名精确性**: JSON 文件名必须与组件配置（`dataTypesConfig`, `gaugeConfigurations`）中指定的 `fileName` 完全匹配（包括大小写）。参考 [`file_name_list.txt`](file_name_list.txt)。
-   **数据量与性能**: 项目中的数据文件可能非常大。`Panel.vue` 已实现了异步分块降采样。如果 `Graph.vue` 或 `Indicators.vue` 在加载非常大的数据集时出现性能问题，也应考虑为它们引入类似的降采样或数据窗口化策略。
-   **`SocketService.js`**: 此文件当前在核心图表数据加载流程中已不再使用。如果项目中仍有其他功能依赖它，请确保其逻辑与当前需求兼容或进行相应调整。

希望这份更新的指南能为后续的开发工作提供清晰的指引！