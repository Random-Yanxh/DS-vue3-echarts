# 项目指南：基于源网荷储一体化的可视化仿真平台前端

本文档旨在帮助开发人员理解本项目（Vue 3 + Vite + ECharts + Pinia）的结构、核心架构、数据流以及关键组件，以便进行后续的开发和维护。

## 1. 项目概述

-   **项目核心功能**: 提供一个可视化的前端界面，用于展示和模拟不同工况下微电网系统的各项数据指标和运行状态。
-   **主要技术栈**:
    -   **前端**: Vue 3 (Composition API), Vite, Pinia (用于状态管理), Vue Router, ECharts (用于数据可视化)。
    -   **CSS**: `normalize.css` 及自定义样式。
-   **当前数据交互模式**:
    -   **主要图表/组件数据**: 主要从位于 `public/data/` 目录下的静态 JSON 文件中获取。每个预设的运行工况对应一个子文件夹，内含该工况下的各类设备和系统日志数据。组件通过 `fetch` API 异步加载。
    -   **`Gridmap.vue` 动态数据**: 部分动态数据通过 WebSocket (`ws://localhost:9998`) 从配套的 Koa 后端服务获取，由 [`src/utils/socket_service.js`](src/utils/socket_service.js:1) 处理。
    -   **状态同步**: 通过 Pinia store ([`src/stores/modeStore.js`](src/stores/modeStore.js:1)) 全局管理和同步当前选定的运行工况模式。

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
    -   **启动后端 Koa 服务** (为 `Gridmap.vue` 组件提供WebSocket数据):
        在一个终端中运行：
        ```bash
        npm run server
        ```
        WebSocket 服务将监听 `9998` 端口。
    -   **启动前端 Vite 开发服务器**:
        在新的终端中运行：
        ```bash
        npm run dev
        ```
        前端应用启动后，通常可在 `http://localhost:5173` 访问。
    *注意：为保证 `Gridmap.vue` 组件的完整功能，前端和后端Koa服务建议同时运行。*
-   **生产环境构建**:
    ```bash
    npm run build
    ```
    构建产物将输出到 `dist` 目录。
-   **预览生产构建**:
    ```bash
    npm run preview
    ```

## 3. 目录结构详解 (主要)

```
├── public/
│   ├── data/                     # 存放所有工况模式的静态JSON数据 (主要数据源)
│   │   ├── MG_Islanded_Mode_json/  # 示例：孤岛运行模式数据文件夹
│   │   │   ├── BatteryLog_SOC_pct.json
│   │   │   └── ... (其他数据文件)
│   │   ├── MG_IslandToGrid_Switch_json/
│   │   ├── MG_GridConnected_Mode_json/
│   │   ├── MG_GridToIsland_Mode_json/
│   │   └── MG_GridToIsland_withoutplan_Mode_json/
│   └── favicon.ico
├── koa/                          # 后端Koa.js模拟服务
│   ├── app.js                    # Koa 应用主入口, 启动 WebSocket 服务
│   ├── web_socket_service.js     # WebSocket 服务端逻辑 (主要为Gridmap服务)
│   └── data/                     # 存放 Gridmap.vue 可能依赖的WebSocket模拟数据
├── src/
│   ├── App.vue                   # Vue 应用根组件
│   ├── main.js                   # Vue 应用初始化入口
│   ├── assets/                   # 静态资源 (图片, CSS, 字体, ECharts 主题)
│   ├── components/               # 可复用的 Vue 组件
│   │   ├── Control/index.vue     # 工况模式选择控制面板
│   │   ├── Graph/index.vue       # 系统功率平衡图 (堆叠面积图)
│   │   ├── Indicators/index.vue  # 单一指标动态曲线图 (带下拉选择)
│   │   ├── Panel/index.vue       # 三个动态仪表盘的面板组件
│   │   ├── Gridmap/index.vue     # 微电网拓扑图组件 (部分数据源为WebSocket)
│   │   ├── Frequence/index.vue   # 系统频率曲线图 (多线同列)
│   │   ├── Hydrogon/index.vue    # 氢系统参数图 (多线，多Y轴)
│   │   ├── DV/index.vue          # 关键直流电压图 (多线)
│   │   └── DA/index.vue          # 关键直流电流图 (多线)
│   ├── router/                   # Vue Router 配置 (`src/router/index.js`)
│   ├── stores/                   # Pinia 状态管理
│   │   └── modeStore.js          # 核心：管理当前运行工况模式
│   ├── utils/                    # 前端通用工具函数
│   │   └── socket_service.js     # WebSocket 客户端服务封装 (主要为Gridmap服务)
│   └── views/                    # 页面级视图组件
│       └── HomeView.vue          # 主仪表盘视图 (包含两页布局)
├── .gitignore
├── file_name_list.txt            # 数据文件名及其含义的对照表 (重要参考)
├── package.json
└── vite.config.js
```

## 4. 核心架构：工况切换与数据动态加载

本项目的核心交互逻辑围绕着由 [`src/components/Control/index.vue`](src/components/Control/index.vue:1) 组件控制的**运行工况模式切换**，以及各可视化组件对此变化的响应和数据的动态加载。

### 4.1. Pinia 状态管理 (`src/stores/modeStore.js`)
项目使用 Pinia 进行全局状态管理，核心是定义在 [`src/stores/modeStore.js`](src/stores/modeStore.js:1) 中的 `mode` store。它主要负责管理和分发当前选中的运行工况模式信息。

其关键组成部分包括：
-   **`modesConfig`**: 一个响应式数组 (`ref`)，包含了所有预定义的运行工况模式的配置对象。每个配置对象通常包含以下属性：
    *   `id` (String): 工况的唯一标识符，例如 `'island_running'`。
    *   `label` (String): 用于在选择控件中显示的工况名称，例如 “孤岛运行”。
    *   `folderName` (String): 对应在 `public/data/` 目录下存放该工况数据的子文件夹名称，例如 `MG_Islanded_Mode_json`。
    *   `description` (String): 对该工况模式的详细文字描述。
-   **`selectedModeId`**: 一个响应式变量 (`ref`)，存储当前被用户选中的工况模式的 `id`。应用初始化时，默认选中 `modesConfig` 数组中的第一个工况。
-   **`selectedMode`**: 一个计算属性 (`computed`)，它根据 `selectedModeId` 的值从 `modesConfig` 数组中查找并返回当前选中工况的完整配置对象。如果找不到对应的 `id`，会返回默认的第一个工况对象作为回退。
-   **`selectedModeFolderPath`**: 一个计算属性 (`computed`)，它基于 `selectedMode.value.folderName` 动态生成当前选中工况的数据文件夹的相对URL路径。例如，如果选中工况的 `folderName` 是 `MG_Islanded_Mode_json`，则此计算属性会返回 `/data/MG_Islanded_Mode_json/`。这个路径是其他组件构建具体数据文件URL的基础。
-   **`setSelectedMode(modeId)`**: 一个函数 (action)，用于更新 `selectedModeId` 的值。当用户通过 `Control` 组件选择新的工况时，此函数会被调用。它会校验传入的 `modeId` 是否存在于 `modesConfig` 中，如果不存在，则会将 `selectedModeId` 重置为默认值。

### 4.2. `Control` 组件 (`src/components/Control/index.vue`)
`Control` 组件是用户选择不同运行工况模式的交互界面。其主要功能和实现方式如下：
-   **获取工况列表**: 组件从 `modeStore` 中获取 `modesConfig` 数组，用于动态渲染工况选择按钮。
-   **渲染选择按钮**: 使用 `v-for` 指令遍历 `modeStore.modesConfig`，为每个工况模式生成一个按钮。按钮上显示的文本是工况对象的 `label` 属性。
-   **高亮活动状态**: 通过比较 `modeStore.selectedModeId` 和每个工况按钮对应的 `mode.id`，动态地为当前选中的工况按钮添加 `.active` CSS类，以高亮显示。
-   **更新全局状态**: 当用户点击某个工况按钮时，会触发一个事件，调用组件内部的 `selectMode(mode.id)` 方法，该方法进而调用 `modeStore.setSelectedMode(mode.id)` 来更新全局选中的工况ID。
-   **显示工况描述**: 组件下方有一个描述区域，通过计算属性 `currentDescription` (其值来源于 `modeStore.selectedMode.description`) 来实时显示当前选中工况的详细文字说明。
-   **标题样式**: 组件包含一个标题“▎运行模式控制”，其样式采用统一的 `.title` CSS类。

### 4.3. 数据展示组件详解

#### 4.3.1. 通用数据加载与处理模式
项目中多个核心图表组件（如 `Graph.vue`, `Frequence.vue`, `Hydrogon.vue`, `DV.vue`, `DA.vue`, `Panel.vue` 以及 `Indicators.vue`）在数据加载和处理方面遵循一些通用模式：
1.  **注入 Pinia Store**: 在 `<script setup>` 中通过 `const modeStore = useModeStore();` 获取 `mode` store 的实例。
2.  **监听工况变化**: 使用 `watch` 函数监听 `modeStore.selectedModeFolderPath` 的变化。当此路径改变时（即用户选择了新的工况模式），触发数据重新加载的逻辑。
3.  **数据系列配置**: 每个多系列图表组件（如 `Graph`, `Frequence`, `Hydrogon`, `DV`, `DA`）通常在其内部定义一个名为 `xxxSeriesConfig` 的常量数组。此数组包含了该图表需要展示的所有数据系列的信息，例如：
    *   `name` (String): 系列名称，用于图例显示。
    *   `fileName` (String): 对应在 `public/data/MODE_FOLDER/` 目录下的JSON数据文件名（不含 `.json` 后缀）。
    *   `unit` (String): 数据的单位，用于图表提示或轴标签。
    *   `color` (String): 系列的显示颜色。
    *   `initiallyVisible` (Boolean, 可选): 标记该系列是否在初始加载时默认显示（主要用于 `Frequence.vue` 的按需加载，其他组件则初始全部显示）。
    *   `yAxisIndex` (Number, 可选): 在多Y轴图表（如 `Hydrogon.vue`）中，指定该系列数据关联的Y轴索引。
4.  **构建文件路径与数据获取**: 当监听到工况变化或需要加载特定系列数据时，组件会结合 `modeStore.selectedModeFolderPath` 和系列配置中的 `fileName` 来构建一个完整的数据文件URL。然后使用浏览器内置的 `fetch` API 异步获取JSON数据。对于需要一次性加载多个系列的组件，通常会使用 `Promise.all` 来并行处理这些请求。
5.  **数据格式与处理**:
    *   从JSON文件加载的原始数据通常是一个对象数组，每个对象包含 `time` 和 `value` 属性，例如 `[ { "time": 0, "value": 10.5 }, ... ]`。
    *   **数据清洗与转换**: 在将数据传递给ECharts之前，通常会进行一步数据清洗，例如使用 `Number()` 转换确保 `time` 和 `value` 是数字类型，并可能过滤掉无效数据点（如 `NaN` 值）。
    *   **数据降采样**: 为了优化前端性能，特别是处理高密度时间序列数据时，`Frequence`, `Hydrogon`, `DV`, `DA` 以及 `Panel` 组件都实现或使用了数据降采样逻辑。这些逻辑旨在从大量原始数据点中选取具有代表性的子集，目标时间步长通常设定为 `1e-3` 秒（即1毫秒），从而在保持图表视觉特征的同时显著减少渲染负荷。
    *   **单位转换**: 某些组件（如 `Graph.vue`）在处理数据时还会进行单位转换，例如将瓦特 (W) 转换为千瓦 (kW)，以便在图表上以更合适的尺度显示。

#### 4.3.2. 特定组件功能说明

*   **`Graph.vue` (系统功率平衡曲线图)**:
    *   此组件用于展示微电网系统中主要发电设备（光伏、风机、电池放电、电网输入）和主要用电设备（常规负载、电动汽车充电、电解槽制氢）的有功功率动态。
    *   采用ECharts的**堆叠面积图**形式，所有功率数据（统一转换为kW）在同一Y轴上堆叠，直观展示各部分功率贡献及系统整体的功率平衡状况。
    *   数据系列配置在其内部的 `powerBalanceConfig` 数组中定义。
    *   工况切换时，所有系列数据一次性加载并更新。

*   **`Indicators.vue` (指标动态曲线图)**:
    *   提供了一个通用的单曲线展示界面，用户可以通过组件顶部的**下拉菜单**选择不同的“模块”（如电池、光伏、负荷等）和该模块下的具体“参数”（如有功功率、A相电压等）。
    *   选择后，组件会加载并显示对应单一数据系列的动态曲线。
    *   其数据文件与图表参数的映射关系定义在内部的 `dataTypesConfig` 对象中。

*   **`Panel.vue` (关键指标仪表盘)**:
    *   此组件固定展示三个ECharts仪表盘，用于显示特定的关键性能指标。
    *   每个仪表盘的数据从其内部 `gaugeConfigurations` 配置中指定的JSON文件加载。
    *   实现了独立的模拟时钟和数据动画播放逻辑（包括播放、暂停、重置控制），并对仪表盘数据进行了异步分块降采样处理。

*   **`Frequence.vue` (系统频率曲线图)**:
    *   设计用于在同一个图表上集中展示来自多个不同模块（如电网、电池、光伏、风机、负荷、充电桩、电解槽）的频率数据。
    *   所有频率曲线共享同一个Y轴，单位为赫兹 (Hz)。
    *   **初始加载特性**：为了优化初次渲染性能，该组件在加载时仅默认获取并显示“电网频率”的数据。
    *   **按需加载与图例交互**：其他模块的频率曲线数据，用户可以通过点击图表顶部的图例项来按需加载和显示/隐藏。
    *   数据系列在其内部的 `frequencySeriesConfig` 数组中配置。

*   **`Hydrogon.vue` (氢系统关键参数图)**:
    *   专门用于展示与氢能源相关的多个关键参数，包括电解槽的氢气生成速率、储氢罐的输入参数（具体物理量根据数据文件确定，可能是压力或电压）、输出流量以及储氢罐的健康状态 (SOH)。
    *   **多Y轴设计**：由于这些参数的单位和数值范围差异较大（例如 mol/s, L/min, %, 以及一个待定单位的输入参数），此组件为不同的参数配置了多个Y轴（当前设计为3个，分别位于图表左侧和右侧），以便清晰、准确地展示各自的动态变化。
    *   **初始加载特性**：与 `DV.vue` 和 `DA.vue` 类似，当工况模式切换时，`Hydrogon.vue` 会一次性加载并显示其配置中的所有四个数据系列。
    *   数据系列在其内部的 `hydrogonSeriesConfig` 数组中配置。

*   **`DV.vue` (关键直流电压图)**:
    *   集中展示项目中几个关键模块的直流母线电压或直流侧电压，当前包括电池直流电压、充电桩（电动汽车）内部电池电压和电解槽直流侧工作电压。
    *   所有电压曲线共享同一个Y轴，单位为伏特 (V)。
    *   **初始加载特性**：工况模式切换时，该组件会一次性加载并显示所有配置的三个直流电压数据系列。
    *   数据系列在其内部的 `dcVoltageSeriesConfig` 数组中配置。

*   **`DA.vue` (关键直流电流图)**:
    *   与 `DV.vue` 类似，此组件用于集中展示关键模块的直流侧电流，当前包括电池直流电流、充电桩（电动汽车）内部电池充电电流和电解槽直流侧工作电流。
    *   所有电流曲线共享同一个Y轴，单位为安培 (A)。
    *   **初始加载特性**：工况模式切换时，该组件会一次性加载并显示所有配置的三个直流电流数据系列。
    *   数据系列在其内部的 `dcCurrentSeriesConfig` 数组中配置。

*   **`Gridmap.vue` (微电网拓扑连接图)**:
    *   该组件用于可视化展示微电网的拓扑结构，包括各个设备（如光伏、风机、储能、负载、电网连接点等）及其连接关系。
    *   其基础拓扑结构数据（通常是 `microgrid_topology.json`）从 `public/data/gridmap/` 目录通过 `fetch` API 加载。
    *   部分表示节点动态状态的数据（例如，通过 `chartName: 'gridmap'` 请求的数据）仍然依赖注入的 `SocketService` 实例从Koa后端WebSocket服务获取。

## 5. 路由配置 (`src/router/index.js`)

项目使用 Vue Router (`v4.x`) 进行路由管理，采用 HTML5 History 模式。主要的路由配置如下：

-   **根路径 `/`**:
    *   名称 (`name`): `'home'`
    *   组件 (`component`): `HomeView.vue` (直接导入)
    *   这是应用的默认入口，展示包含两页内容的主仪表盘界面。

-   **其他辅助视图路径**:
    *   `/indicators`: 指向 `IndicatorsView.vue` (展示单个 `Indicators` 组件)
    *   `/graph`: 指向 `GraphView.vue` (展示单个 `Graph` 组件)
    *   `/map`: 指向 `MapView.vue` (展示单个 `Gridmap` 组件)
    *   `/control`: 指向 `ControlView.vue` (展示单个 `Control` 组件)
    *   这些辅助视图主要用于开发和调试时单独查看某个核心组件，它们均采用**路由懒加载**（例如 `component: () => import('../views/GraphView/index.vue')`）的方式导入，以优化应用的初始加载性能。

*(原 `/epie` 和 `/aichat` 相关的路由及其视图组件已被假定移除，因此未在此列出。)*

## 6. 二次开发指南

### 6.1. 添加新的图表/仪表盘组件 (多系列、按需/全量加载类型)

若需添加新的、与 `Frequence.vue`, `DV.vue` 等组件类似的，能够展示多个时间序列数据并支持工况切换的图表组件，可以遵循以下步骤：

1.  **创建组件文件**: 在 `src/components/` 目录下创建新的 `.vue` 文件（例如 `NewCustomChart.vue`）。可以参考 `Frequence.vue` (按需加载) 或 `DV.vue` (全量加载) 的代码结构作为起点。
2.  **脚本核心逻辑 (`<script setup>`)**:
    *   **导入依赖**: 引入 `ref`, `inject`, `onMounted`, `onBeforeUnmount`, `watch` 等Vue API，以及 `useModeStore`。
    *   **ECharts 与 Store**: 注入 `echarts` 实例，获取 `modeStore` 实例。
    *   **DOM引用与实例**: 定义图表容器的 `ref` (例如 `new_custom_chart_element`) 和 ECharts 实例变量 (`chartInstance`)。
    *   **配置数据系列**: 创建一个常量数组（例如 `newCustomSeriesConfig`），用于定义此图表要展示的所有数据系列。每个系列对象应至少包含：
        *   `name` (String): 系列名称，用于图例。
        *   `fileName` (String): 对应的JSON数据文件名（不含扩展名）。
        *   `unit` (String): 数据单位，用于Tooltip提示。
        *   `color` (String): 系列颜色。
        *   `initiallyVisible` (Boolean, 可选): 若为 `false`，则该系列初始不加载数据，需配合图例点击按需加载；若为 `true` 或未定义，则初始加载。
        *   `yAxisIndex` (Number, 可选): 如果图表使用多Y轴，指定此系列关联的Y轴。
    *   **`downsampleData` 函数**: 实现或复用一个数据降采样函数，接收原始数据和目标时间步长（如 `1e-3`），返回降采样后的数据。
    *   **`fetchAndProcessSeriesData` 函数**: 这是一个辅助函数，负责获取并处理单个数据系列。它接收一个系列配置对象，构造文件路径，使用 `fetch` 获取数据，进行JSON解析、数据格式转换（确保 `time` 和 `value` 为数字）和降采样。
    *   **`fetchDataForNewCustomChart` 函数**: 此函数负责加载一个或多个系列的数据。
        *   如果实现按需加载（如 `Frequence.vue`）：初始调用时，仅加载 `initiallyVisible: true` 的系列。
        *   如果实现初始全量加载（如 `DV.vue`）：遍历 `newCustomSeriesConfig`，调用 `fetchAndProcessSeriesData` 获取所有系列的数据。
        *   将获取并处理后的数据存入一个响应式对象（如 `allSeriesData`），通常以 `fileName` 为键。
    *   **`updateChart` 函数**: 这是核心的ECharts配置函数。
        *   遍历 `newCustomSeriesConfig` 和 `allSeriesData` 来构建ECharts的 `series` 数组。
        *   配置 `tooltip`, `legend` (包括 `selected` 属性以控制初始显隐状态), `grid`, `xAxis`, `yAxis` (支持单Y轴或多Y轴配置), `dataZoom` 等。
        *   最后调用 `chartInstance.setOption(option, true)` 更新图表。
    *   **`setupLegendListener` 函数 (仅按需加载时需要)**: 如果实现了按需加载，则在此函数中监听ECharts的 `legendselectchanged` 事件。当用户点击图例项以显示某个未加载的系列时，触发 `fetchAndProcessSeriesData` 获取该系列数据，然后更新 `allSeriesData` 并调用 `updateChart`。
    *   **生命周期与监听**:
        *   在 `onMounted` 中调用 `initChart` (内部可调用 `setupLegendListener` 如果需要) 和 `screenAdapter`，并注册窗口大小变化监听。
        *   在 `onBeforeUnmount` 中清理监听器和销毁ECharts实例。
        *   使用 `watch` 监听 `modeStore.selectedModeFolderPath` 的变化，当路径改变时，清空 `allSeriesData` (或按需保留部分) 并调用 `fetchDataForNewCustomChart` 重新加载数据。设置 `{ immediate: true }` 以便组件挂载时立即加载初始数据。
    *   **`screenAdapter` 函数**: 用于处理图表响应式尺寸调整。
3.  **模板 (`<template>`)**:
    *   包含一个主容器 `div`。
    *   在容器内添加标题元素，例如 `<div class="title">▎ 新图表标题</div>`。
    *   添加一个 `div` 作为ECharts图表的挂载点，并赋予其 `ref` (例如 `ref="new_custom_chart_element"`)。
4.  **样式 (`<style scoped>`)**:
    *   为组件容器、标题、图表区域添加必要的CSS样式。标题样式应使用统一的 `.title` 类。
5.  **集成到父组件**: 在需要展示此新图表的父组件（通常是 [`src/views/HomeView.vue`](src/views/HomeView.vue:1)）中：
    *   导入新创建的组件。
    *   在模板的适当位置使用该组件标签。
    *   如有必要，调整父组件的CSS Grid布局（例如 `grid-template-areas`）以容纳新组件。

### 6.2. 为现有组件添加或修改数据系列

1.  **准备数据文件**: 在 `public/data/MODE_FOLDER/` 目录下为所有相关的工况模式添加或修改对应的JSON数据文件。确保文件内容是 `[ { "time": ..., "value": ... }, ... ]` 格式。
2.  **更新 `file_name_list.txt`**: 如果是全新的数据系列，建议在此文件中添加一行来描述新JSON文件的文件名及其代表的物理含义和单位。
3.  **修改组件内部配置**:
    *   对于基于 `xxxSeriesConfig` 数组的组件（如 `Frequence.vue`, `Hydrogon.vue`, `DV.vue`, `DA.vue`, `Graph.vue`）:
        *   直接打开对应组件的 `.vue` 文件。
        *   找到其内部定义的 `xxxSeriesConfig` 数组。
        *   添加一个新的对象来描述新的数据系列（包括 `name`, `fileName`, `unit`, `color`, `initiallyVisible` (根据需要设置), `yAxisIndex` (如果适用)等属性），或者修改现有系列对象的属性。
    *   对于 `Indicators.vue` 组件:
        *   打开 `src/components/Indicators/index.vue`。
        *   修改其内部的 `dataTypesConfig` 对象，添加或修改条目。每个条目将组件内的模块/参数选择映射到具体的 `chartName` (JSON文件名，不含后缀)、`text` (显示文本)、`yAxisName` (Y轴标签) 和 `seriesName` (图例名称)。
        *   如果新系列属于新的模块或参数类型，可能还需要更新 `moduleOptions` 或 `parameterOptions` 数组。
    *   对于 `Panel.vue` 组件:
        *   打开 `src/components/Panel/index.vue`。
        *   修改其内部的 `gaugeConfigurations` 数组，调整对应仪表盘的 `fileName`, `name`, `unit` 等属性。

### 6.3. 添加新的运行工况模式

要在系统中添加一个新的运行工况模式，请遵循以下步骤：

1.  **创建数据目录**: 在 `public/data/` 目录下，为新的工况模式创建一个子文件夹。文件夹名称应具有描述性，并与后续配置保持一致（例如，`MG_NewCustom_Mode_json`）。
2.  **准备数据文件**: 将该新工况模式对应的所有JSON数据文件（应遵循 [`file_name_list.txt`](file_name_list.txt:1) 中已有的文件命名约定和数据格式）放入上一步创建的新文件夹中。确保每个需要被图表组件加载的数据文件都已存在。
3.  **更新状态管理配置**: 打开 [`src/stores/modeStore.js`](src/stores/modeStore.js:1) 文件。
4.  **添加新模式到 `modesConfig`**: 在 `modesConfig` ref 数组中，添加一个新的JavaScript对象来描述这个新工况。该对象应包含以下属性：
    *   `id` (String): 为新工况指定一个唯一的ID (例如, `'new_custom_mode'`)。
    *   `label` (String): 新工况在 `Control` 组件选择按钮上显示的名称 (例如, "自定义新工况")。
    *   `description` (String): 对这个新工况模式的详细文字说明。
    *   `folderName` (String): 必须与步骤1中创建的数据子文件夹的名称完全一致 (例如, `MG_NewCustom_Mode_json`)。

完成以上步骤后，新的运行工况模式应该就能在 `Control` 组件中被选择，并且各个图表组件也会尝试从新指定的路径加载对应的数据。

## 7. 注意事项
-   **数据文件路径与格式**: 确保所有工况的JSON数据文件都准确放置在 `public/data/` 目录下的对应工况子文件夹中。前端组件通过 `fetch` API 构造的路径是相对于 `public` 目录的。JSON文件内容必须是 `[ { "time": ..., "value": ... }, ... ]` 格式的对象数组。
-   **文件名精确性**: JSON数据文件名必须与各组件内部配置（如 `xxxSeriesConfig` 中的 `fileName` 属性）中指定的名称完全匹配，包括大小写。建议勤参考 [`file_name_list.txt`](file_name_list.txt:1)。
-   **数据量与性能**: 虽然项目中多个组件已引入数据降采样机制，但在处理非常巨大的原始数据集时，仍需关注前端的加载、处理和渲染性能。可以根据实际情况调整降采样的目标时间步长或算法。
-   **`SocketService.js` 与 Koa 后端**: 当前，[`src/utils/socket_service.js`](src/utils/socket_service.js:1) 和配套的Koa后端服务主要为 [`src/components/Gridmap/index.vue`](src/components/Gridmap/index.vue:1) 组件提供部分动态数据。如果未来 `Gridmap.vue` 的数据也完全改为从静态JSON文件获取，那么 `SocketService` 和整个 `koa` 后端目录则可以考虑被移除。
-   **ECharts 多Y轴**: 在为图表（如 `Hydrogon.vue`）配置多个Y轴时，需要仔细调整每个Y轴的 `position` (如 `'left'`, `'right'`) 和 `offset` 属性，以及图表 `grid` 组件的边距（`left`, `right`），以确保轴标签、名称和图表内容有足够的空间，避免相互重叠。

希望这份更新的指南能为后续的开发工作提供清晰、准确的指引！