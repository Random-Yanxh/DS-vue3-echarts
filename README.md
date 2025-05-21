# HM-vue3-echarts 项目说明

本项目是基于 Koa 为后台，Vue 3 为前端框架的项目，用于电商平台数据可视化实时监控系统。

## 目录结构说明

*   `.git/`: Git 仓库目录，包含版本控制信息。
*   `.gitignore`: Git 忽略文件配置文件，定义了不需要纳入版本控制的文件和目录。
*   `.vscode/`: VS Code 编辑器配置文件目录，包含代码风格、调试配置等信息。
*   `index.html`: 项目的 HTML 入口文件，定义了页面的基本结构。
*   `koa/`: 后端 Koa 服务的相关文件，可能包含路由、控制器、模型等。
*   `node_modules/`: 项目依赖的 Node.js 模块，通过 npm 或 yarn 安装。
*   `package-lock.json`: 锁定项目依赖版本的配置文件，确保依赖的一致性。
*   `package.json`: 项目的配置文件，包含项目名称、版本、依赖、脚本等信息。
*   `public/`: 静态资源目录，存放图片、字体等资源文件。
*   `README.md`: 项目说明文档，包含项目介绍、使用方法等信息。
*   `src/`: 项目的核心代码目录，包含 Vue 组件、JavaScript 逻辑、CSS 样式等。
*   `vite.config.js`: Vite 构建工具的配置文件，定义了构建规则、插件、代理等。

## 文件说明

*   `package.json`: 项目的配置文件，包含项目名称、版本、依赖、脚本等信息。
*   `vite.config.js`: Vite 构建工具的配置文件，定义了构建规则、插件、代理等。
*   `index.html`: 项目的 HTML 入口文件，定义了页面的基本结构。

## 使用方法

1.  运行 `npm i` 安装依赖
2.  开启一个 terminal 运行 `npm run server` 跑起后台服务，端口7777，websocket服务9998
3.  再新开一个 terminal 运行 `npm run dev` 跑起前端项目

## 修改页面布局

如果您需要修改页面布局，您应该修改 `src/components` 目录下的 Vue 组件。例如，`src/components/Map/index.vue` 文件包含了地图组件的布局和样式。您可以修改该文件中的 HTML 结构和 CSS 样式，以达到您想要的页面布局效果。您也可以修改 `src/views/HomeView.vue` 文件来调整整个页面的布局。
