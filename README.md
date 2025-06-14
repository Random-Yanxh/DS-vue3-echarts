# 项目名称：基于源网荷储一体化的可视化仿真平台前端

本项目是基于 Vue 3、Vite、ECharts 和 Pinia 构建的前端应用程序，旨在为绿氢微电网平台的实时仿真数据提供可视化监控界面。

## 主要技术栈

*   **前端框架**: Vue 3 (Composition API)
*   **构建工具**: Vite
*   **状态管理**: Pinia
*   **路由**: Vue Router
*   **数据可视化**: Apache ECharts
*   **数据源**:
    *   主要图表数据：通过 `fetch` API 从 `public/data/` 目录下的静态 JSON 文件加载，根据Pinia store中选择的运行工况动态切换。
    *   `Gridmap.vue` 组件动态数据：通过 WebSocket (`ws://localhost:9998`) 从配套的 Koa 后端服务获取。

## 目录结构概览

*   `public/data/`: 存放各运行工况下的静态JSON数据文件。
*   `src/`: 项目核心源代码。
    *   `assets/`: 存放图片、CSS、字体、ECharts主题等静态资源。
    *   `components/`: 存放可复用的Vue组件（如 `Graph.vue`, `Gridmap.vue`, `Panel.vue`, `Frequence.vue`, `Hydrogon.vue`, `DV.vue`, `DA.vue` 等）。
    *   `router/`: Vue Router 路由配置。
    *   `stores/`: Pinia 状态管理 (核心为 `modeStore.js`)。
    *   `utils/`: 通用工具函数 (如 `socket_service.js` 用于 `Gridmap.vue`)。
    *   `views/`: 页面级视图组件 (主要是 `HomeView.vue`)。
*   `koa/`: 后端Koa.js模拟服务，主要为 `Gridmap.vue` 提供WebSocket数据。
    *   `koa/app.js`: Koa服务启动入口。
    *   `koa/web_socket_service.js`: WebSocket 服务端逻辑。
    *   `koa/data/`: 存放 `Gridmap.vue` 可能依赖的WebSocket模拟数据。
*   `index.html`: 项目的HTML入口文件。
*   `package.json`: 项目配置文件，包含依赖和脚本。
*   `vite.config.js`: Vite 构建工具配置文件。
*   `guide.md`: 详细的二次开发指南。

## 项目运行方法

1.  **安装依赖**:
    ```bash
    npm install
    ```
    或
    ```bash
    yarn install
    ```
2.  **启动后端Koa服务** (为 `Gridmap.vue` 组件提供WebSocket数据):
    在一个终端中运行：
    ```bash
    npm run server
    ```
    这将启动Koa服务，HTTP API (如果仍有定义) 监听 `7777` 端口，WebSocket 服务监听 `9998` 端口。

3.  **启动前端Vite开发服务器**:
    在新的终端中运行：
    ```bash
    npm run dev
    ```
    前端项目通常会运行在 `http://localhost:5173` (或Vite自动选择的其他端口)。

确保前端和后端服务都已成功启动，即可在浏览器中访问前端应用。

