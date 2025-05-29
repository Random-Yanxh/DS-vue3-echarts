# 项目指南：Frontend/HM-vue3-echarts

本文档旨在帮助开发人员理解 `Frontend/HM-vue3-echarts` 项目的结构、关键组件以及数据流，以便进行后续的开发和维护。

## 1. 项目概述

-   **项目名称**: `vision` (根据 `package.json`)，但功能上是一个绿氢微电网平台实时仿真监控系统。
-   **技术栈**:
    -   前端: Vue 3 (v3.2.45), Vite (v4.0.0), ECharts (v5.4.1), Pinia (v2.0.28) (状态管理), Vue Router (v4.1.6)。
    -   CSS: `normalize.css` 用于样式重置，自定义全局样式及图标字体。
    -   后端 (数据模拟): Koa.js (v2.14.1), `ws` (v8.12.1) (WebSocket 服务)。
-   **主要功能**: 提供一个可视化的界面，用于实时监控和仿真微电网平台的各项数据指标和状态，如图表、地图、KPI 等。数据主要通过 WebSocket 进行实时更新，部分可能通过 HTTP API 获取。

## 2. 项目启动与构建

-   **环境要求**: Node.js
-   **依赖安装**:
    ```bash
    npm install
    ```
-   **启动开发环境**:
    -   启动前端 Vite 开发服务器 (通常热更新，端口默认为 Vite 配置，如 5173):
        ```bash
        npm run dev
        ```
    -   启动后端 Koa 数据模拟服务 (HTTP API 在 7777 端口, WebSocket 在 9998 端口，使用 nodemon 支持热重载):
        ```bash
        npm run server
        ```
    *注意：前端和后端服务需要同时运行。*
-   **生产环境构建**:
    ```bash
    npm run build
    ```
    构建产物会输出到 `dist` 目录 (Vite 默认)。
-   **预览生产构建**:
    ```bash
    npm run preview
    ```

## 3. 目录结构详解

```
Frontend/HM-vue3-echarts/
├── koa/                      # 后端数据模拟服务 (Koa.js)
│   ├── app.js                # Koa 应用主入口，启动 HTTP 和 WebSocket 服务
│   ├── web_socket_service.js # WebSocket 服务端逻辑
│   ├── data/                 # 存放各类模拟数据的 JSON 文件 (按图表或功能命名)
│   │   ├── aichat.json
│   │   ├── epie.json
│   │   ├── graph/
│   │   │   ├── wp.json
│   │   │   └── wq.json
│   │   └── ... (其他数据文件)
│   ├── middleware/           # Koa 中间件
│   │   ├── koa_response_data.js    # 处理 HTTP API 数据响应
│   │   ├── koa_response_duration.js # 计算响应时长
│   │   └── koa_response_header.js   # 设置响应头
│   └── utils/                # Koa 服务端工具
│       └── file_utils.js       # 读取文件内容的工具
├── public/                   # Vite public 目录，此中资源会直接复制到构建输出根目录
│   └── favicon.ico
├── src/                      # 前端核心源代码 (Vue 3)
│   ├── App.vue               # Vue 应用根组件
│   ├── main.js               # Vue 应用初始化入口 (实例化 Vue, Pinia, Router, SocketService)
│   ├── assets/               # 静态资源 (图片, CSS, 字体, ECharts 主题, 地图 GeoJSON)
│   │   ├── font/             # 图标字体 (iconfont)
│   │   ├── map/              # 地图 GeoJSON 文件 (中国及各省)
│   │   └── theme/            # ECharts 主题文件 (chalk.js, vintage.js, etc.)
│   ├── components/           # 可复用的 Vue 组件 (如 Graph, Gridmap, EPie 等)
│   ├── composables/          # Vue 3 Composition API 可组合函数
│   │   └── useRequest.js     # 封装的 HTTP fetch 请求
│   ├── router/               # Vue Router 配置
│   │   └── index.js          # 路由定义
│   ├── stores/               # Pinia 状态管理
│   │   └── counter.js        # 示例 store (需确认实际业务 store)
│   ├── utils/                # 前端通用工具函数
│   │   ├── map_utils.js      # 地图相关工具
│   │   └── socket_service.js # 前端 WebSocket 客户端服务封装
│   └── views/                # 页面级视图组件 (路由的目标)
│       ├── HomeView.vue      # 主仪表盘视图
│       └── ... (其他视图如 GraphView, MapView 等)
├── .gitignore
├── index.html                # Vite 项目入口 HTML
├── package.json              # 项目依赖和脚本
├── README.md                 # 项目说明文档
└── vite.config.js            # Vite 构建配置文件
```

## 4. 数据流与状态管理

项目的数据流主要分为两部分：通过 HTTP API 获取的初始化/静态数据，和通过 WebSocket 获取的实时更新数据。

### 4.1. 后端数据模拟 (Koa.js)

-   **HTTP API 服务**:
    -   启动于 `koa/app.js`，监听端口 `7777`。
    -   通过 `koa/middleware/koa_response_data.js` 中间件处理。
    -   请求路径如 `http://127.0.0.1:7777/api/some_data` 会被映射到读取 `koa/data/some_data.json` 文件。
    -   数据文件通过 `koa/utils/file_utils.js` 中的 `getFileJsonData` 函数读取（返回文件内容的字符串）。
-   **WebSocket 服务**:
    -   启动于 `koa/app.js` (通过调用 `web_socket_service.listen()`)，监听端口 `9998`。
    -   实现在 `koa/web_socket_service.js`。
    -   当客户端发送 `action: 'getData'` 消息时，服务器会根据消息中的 `chartName` 读取对应的 `koa/data/{chartName}.json` 文件，并将文件内容作为 `data` 字段随原消息返回给该客户端。
    -   对于其他 `action`，服务器会将消息广播给所有连接的客户端。

### 4.2. 前端数据获取

-   **HTTP 请求**:
    -   通过 `src/composables/useRequest.js` 封装的 `fetch` API 进行。
    -   基础 URL 为 `http://127.0.0.1:7777/api/`。
    -   包含固定的 `Authorization: Bearer SOMEJWTTOKEN` 请求头。
    -   用于获取非实时数据。
-   **WebSocket 通信**:
    -   通过 `src/utils/socket_service.js` (单例模式) 进行管理。
    -   在 `src/main.js` 中全局初始化并尝试连接到 `ws://localhost:9998`。
    -   服务支持自动重连和发送重试。
    -   组件通过 `SocketService.Instance.registerCallBack(socketType, callback)` 订阅特定类型 (`socketType`) 的消息。
    -   组件通过 `SocketService.Instance.send(payload)` 向服务器发送消息 (例如，请求数据)。
    -   收到的消息结构通常包含 `socketType`, `action`, 和 `data`。对于 `action: 'getData'`，`data` 字段包含从 JSON 文件读取的字符串，前端回调中需要 `JSON.parse()`。

### 4.3. 状态管理 (Pinia)

-   项目使用 Pinia (`v2.0.28`) 进行状态管理。
-   Pinia 在 `src/main.js` 中全局安装。
-   具体的 store 定义在 `src/stores/` 目录下 (例如，`counter.js` 是一个示例)。业务相关的全局状态应通过 Pinia store 进行管理和共享。

## 5. 路由配置 (`src/router/index.js`)

-   使用 Vue Router (`v4.1.6`) 和 HTML5 History 模式。
-   **主要路由**:
    -   `/` (name: `home`): 指向 `HomeView.vue` (直接导入)。这是应用的主入口和仪表盘。
    -   其他路径如 `/indicators`, `/graph`, `/map`, `/control`, `/epie`, `/aichat` 分别指向对应的视图组件 (例如 `IndicatorsView`, `GraphView` 等)，这些视图均采用**路由懒加载**方式导入，以优化初始加载性能。

## 6. 核心组件与 ECharts 使用

项目包含多个位于 `src/components/` 的核心组件，大量使用 ECharts 进行数据可视化。

-   **ECharts 实例和主题**:
    -   ECharts 实例和 `SocketService` 实例通常通过 Vue 的 `provide/inject` API 在应用层面提供，组件内通过 `inject` 获取。
    -   预定义了多种 ECharts 主题 (如 'chalk') 存放于 `src/assets/theme/`，在初始化图表时使用。
-   **代表性组件 (`Graph/index.vue`)**:
    -   **注入依赖**: `const echarts = inject('echarts')`, `const socket = inject('socket')`。
    -   **初始化**: 在 `onMounted` 中调用 `echarts.init()` 初始化图表。
    -   **数据获取**:
        -   通过 `socket.registerCallBack('graphData', getChartData)` 监听 WebSocket 数据。
        -   通过 `socket.send({ action: 'getData', socketType: 'graphData', chartName: '...' })` 请求数据。
    -   **动态更新**: `getChartData` 回调处理收到的数据，并调用 `updataChart()` (更新图表配置) 和 `updataChartData()` (更新图表数据 `dataset.source`)。
    -   **响应式适配**: `screenAdapter` 方法用于图表尺寸的响应式调整。
-   **其他图表组件** (如 `EPie/index.vue`, `Gridmap/index.vue`) 可能遵循类似的数据获取和渲染模式。
-   **新增信息卡片组件** (`ProjectInfoCard.vue`, `KeyPerformanceIndicators.vue`, `BatteryDetailedStatus.vue`, `EconomicBenefitAnalysis.vue`) 主要用于在 `HomeView.vue` 的第二页展示信息，目前数据源多为静态或待对接。

## 7. 注意事项与修改建议

-   **WebSocket 回调注销**: `src/utils/socket_service.js` 中的 `unRegisterCallBack` 方法实现可能不正确 (目前是赋值而非删除)，如果需要严格的注销逻辑，应修改为 `delete this.callBackMapping[socketType]`。
-   **HTTP API Token**: `src/composables/useRequest.js` 中使用了硬编码的 JWT Token。在实际部署或需要安全性的场景下，应替换为动态获取和管理的 Token 机制。
-   **数据文件路径**: 后端服务强依赖于 `koa/data/` 目录下的 JSON 文件结构和命名。新增数据或修改图表时，需确保对应的 JSON 文件存在且路径正确。
-   **ECharts 实例响应性**: 注意 `Graph/index.vue` 中注释提到的 ECharts 实例不应为 Vue 3 响应式对象的问题。
-   **Pinia Store**: 检查 `src/stores/` 目录，根据实际业务需求组织和使用 Pinia store 来管理共享的应用状态。

---

希望这份指南能帮助您的同事更好地理解和参与到项目中！