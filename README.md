# Gyron

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

`Gyron` 是一款简单零依赖的响应式框架。核心代码大小: <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@gyron/runtime?style=flat-square">。

## 功能

- [x] SSR
- [x] HMR 热更新
  - [x] 无依赖组件热更新
  - [x] 多依赖组件热更新
- [x] 响应数据变更
- [x] 支持原生属性
- [x] 最小化更新
- [x] 错误边界处理
- [x] 插件生态
- [x] 函数式组件
- [x] 上下文信息
- [x] 生命周期
  - [x] beforeMount
  - [x] afterMount
  - [x] beforeUpdate
  - [x] afterUpdate
  - [x] destroyed

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
| [redux](./packages/redux/)                           | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/redux?style=flat-square)              | 全局状态管理器                                                      |
| [jsx-runtime](./packages/jsx-runtime/)           | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/jsx-runtime?style=flat-square)      | 支持 `jsx` 语法的运行时，比如 `babel` 的 `transform-react-jsx` 插件 |
| [reactivity](./packages/reactivity/)             | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/reactivity?style=flat-square)       | 响应式核心                                                          |
| [router](./packages/router/)                     | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/router?style=flat-square)           | 路由管理器                                                          |
| [runtime](./packages/runtime/)                   | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/runtime?style=flat-square)          | 渲染器以及程序入口                                                  |
| [shared](./packages/shared/)                     | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/shared?style=flat-square)           | 公共工具函数                                                        |
| [sync](./packages/sync/)                         | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/sync?style=flat-square)             | 同步第三方数据工具函数，让第三方数据具有反应性                      |

### 例子

- 浏览器中可以使用 `esm` 格式的静态资源，为什么组件返回一个函数可以阅读[组件](https://gyron.cc/docs/component#%E6%9C%89%E7%8A%B6%E6%80%81%E7%BB%84%E4%BB%B6%20%E5%92%8C%20%E6%97%A0%E7%8A%B6%E6%80%81%E7%BB%84%E4%BB%B6)文档

```html
<div id="root"></div>

<script type="module">
  import {
    createInstance,
    h,
    useValue,
  } from 'https://cdn.skypack.dev/@gyron/runtime'
  const App = () => {
    const content = useValue(0)
    // 使用 babel-plugin-jsx 不需要返回一个函数，详情参考 https://gyron.cc/core/jsx/getting-started#%E5%8F%82%E6%95%B0
    return () =>
      h(
        'button',
        {
          on: {
            click() {
              content.value++
            },
          },
        },
        content.value
      )
  }
  createInstance(h(App)).render('#root')
</script>
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
