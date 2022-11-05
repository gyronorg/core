<p align="center">
  <img src="https://gyron.cc/assets/image/logo-sm.png" alt="Gyron Logo">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@gyron/runtime">
    <img alt="@gyron/runtime" src="https://img.shields.io/npm/v/@gyron/runtime?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/@gyron/runtime">
    <img alt="npm" src="https://img.shields.io/npm/l/@gyron/runtime?style=flat-square">
  </a>
  <a href="https://codecov.io/gh/gyronorg/core">
    <img src="https://codecov.io/gh/gyronorg/core/branch/main/graph/badge.svg?token=5OTQPLZQQO"/>
  </a>
</p>

# Gyron

`Gyron` 是一款简单零依赖的响应式框架。核心代码大小: <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@gyron/runtime?style=flat-square">。

它还拥有很好的性能表现，详情可以参见 [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/current.html#eyJmcmFtZXdvcmtzIjpbImtleWVkL2FuZ3VsYXIiLCJrZXllZC9neXJvbiIsImtleWVkL3JlYWN0Iiwibm9uLWtleWVkL2d5cm9uIiwibm9uLWtleWVkL3JlYWN0Il0sImJlbmNobWFya3MiOlsiMDFfcnVuMWsiLCIwMl9yZXBsYWNlMWsiLCIwM191cGRhdGUxMHRoMWtfeDE2IiwiMDRfc2VsZWN0MWsiLCIwNV9zd2FwMWsiLCIwNl9yZW1vdmUtb25lLTFrIiwiMDdfY3JlYXRlMTBrIiwiMDhfY3JlYXRlMWstYWZ0ZXIxa194MiIsIjA5X2NsZWFyMWtfeDgiLCIyMV9yZWFkeS1tZW1vcnkiLCIyMl9ydW4tbWVtb3J5IiwiMjNfdXBkYXRlNS1tZW1vcnkiLCIyNV9ydW4tY2xlYXItbWVtb3J5IiwiMjZfcnVuLTEway1tZW1vcnkiLCIzMV9zdGFydHVwLWNpIiwiMzRfc3RhcnR1cC10b3RhbGJ5dGVzIl0sImRpc3BsYXlNb2RlIjoxLCJjYXRlZ29yaWVzIjpbMSwyLDMsNF19) 提供的结果。

- 文档
  - [English](./README_EN.md)

## 功能

Gyron 已经完成了所有预期之内的功能，可以参考 [http://gyron.cc/](http://gyron.cc/) 查看所有功能说明。

如果你想了解这些功能和社区其它框架有什么不同可以打开 Issues 一起沟通学习，或者 clone 代码后查看对应的模块。

### tsc 命令支持

最简单使用方式就是在 tsconfig.json 中加上下面这个配置，然后在每一个文件加上 `import { reactCreateElement as h } from '@gyron/jsx-runtime'` 一串代码。

```json
{
  "compilerOptions": {
    "jsxFactory": "h"
  }
}
```

或者直接在文件中加入 `/** @jsx h */`。

```jsx
/** @jsx h */
import { h } from '@gyron/jsx-runtime'

const App = () => {
  return <div>Hello World</div>
}
```

### 使用现代的打包工具

- vite
- webpack
- rollup
- parcel

目前模板就是基于 vite 制作而成，在适配其它平台时可以阅读[jsx](https://gyron.cc/core/jsx/getting-started)这篇文档，里面有更新详细的教程。

## 核心

“核心”是指前端项目中可能会用到的周边生态，下面列出的是作者本人维护的。

其中 `router` 和 `redux` 也是运行时的代码，是为了解决复杂项目时，项目的路由和状态管理器。
`dom-client` 和 `dom-server` 分别对应着客户端渲染接口和服务端渲染接口。

| 名称                                             | 版本                                                                                    | 描述                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [babel-plugin-jsx](./packages/babel-plugin-jsx/) | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/babel-plugin-jsx?style=flat-square) | 将 `jsx` 语法转换成可运行的表达式，在开发环境时生成热更新辅助代码   |
| [cli](./packages/cli/)                           | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/cli?style=flat-square)              | 可定制项目的脚手架                                                  |
| [dom-client](./packages/dom-client/)             | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/dom-client?style=flat-square)       | 对接浏览器 `document` 工具，可自定义接入支持 `ecma` 标准的应用程序  |
| [dom-server](./packages/dom-server/)             | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/dom-server?style=flat-square)       | 对接服务端 `node` 工具，用于服务端渲染                              |
| [redux](./packages/redux/)                       | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/redux?style=flat-square)            | 全局状态管理器                                                      |
| [jsx-runtime](./packages/jsx-runtime/)           | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/jsx-runtime?style=flat-square)      | 支持 `jsx` 语法的运行时，比如 `babel` 的 `transform-react-jsx` 插件 |
| [reactivity](./packages/reactivity/)             | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/reactivity?style=flat-square)       | 响应式核心                                                          |
| [router](./packages/router/)                     | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/router?style=flat-square)           | 路由管理器                                                          |
| [runtime](./packages/runtime/)                   | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/runtime?style=flat-square)          | 渲染器以及程序入口                                                  |
| [shared](./packages/shared/)                     | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/shared?style=flat-square)           | 公共工具函数                                                        |
| [sync](./packages/sync/)                         | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/sync?style=flat-square)             | 同步第三方数据工具函数，让第三方数据具有反应性                      |

### 快速使用

``` sh
# 全局安装 CLI
npm install @gyron/cli -g
# 创建项目
gyron create <instance-name>
# 进入项目
cd <instance-name>
# 安装依赖
npm install
# 运行
npm run start
```

### 附加说明

本说明在 MIT 基础之上作为附加说明展示在本文档中展示。

以下为附加说明：

```
任何情况任何人在未经过作者的授权不允许在公司作为 KPI 项目发布或推广，保护开源项目的合法权益。
```

### SSR

完善文档请阅读 [SSR](https://gyron.cc/docs/ssr)

### 更新记录

详情参阅 [CHANGELOG.md](./CHANGELOG.md)

### 测试

请 clone 项目后运行`yarn`，然后再执行`yarn test`

想了解更多，请参阅 [https://gyron.cc/](https://gyron.cc/)。

### 赞赏

如果项目对你有帮助，可以 star 或者微信扫描下方二维码

![reward](https://s2.loli.net/2022/06/26/njGZ4zv2Te87mhE.webp)
