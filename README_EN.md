<p align="center">
  <img src="https://gyron.970819.xyz/assets/image/logo-sm.png" alt="Gyron Logo">
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

`Gyron` is a simple zero-dependency responsive framework . Core code size: <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@gyron/runtime?style=flat-square">。

It also has a very good performance performance, details of which can be found in [js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/current.html#eyJmcmFtZXdvcmtzIjpbImtleWVkL2FuZ3VsYXIiLCJrZXllZC9neXJvbiIsImtleWVkL3JlYWN0Iiwibm9uLWtleWVkL2d5cm9uIiwibm9uLWtleWVkL3JlYWN0Il0sImJlbmNobWFya3MiOlsiMDFfcnVuMWsiLCIwMl9yZXBsYWNlMWsiLCIwM191cGRhdGUxMHRoMWtfeDE2IiwiMDRfc2VsZWN0MWsiLCIwNV9zd2FwMWsiLCIwNl9yZW1vdmUtb25lLTFrIiwiMDdfY3JlYXRlMTBrIiwiMDhfY3JlYXRlMWstYWZ0ZXIxa194MiIsIjA5X2NsZWFyMWtfeDgiLCIyMV9yZWFkeS1tZW1vcnkiLCIyMl9ydW4tbWVtb3J5IiwiMjNfdXBkYXRlNS1tZW1vcnkiLCIyNV9ydW4tY2xlYXItbWVtb3J5IiwiMjZfcnVuLTEway1tZW1vcnkiLCIzMV9zdGFydHVwLWNpIiwiMzRfc3RhcnR1cC10b3RhbGJ5dGVzIl0sImRpc3BsYXlNb2RlIjoxLCJjYXRlZ29yaWVzIjpbMSwyLDMsNF19)

- Readme
  - [中文](./README.md)
  - [Official Website](https://gyron.970819.xyz/en-US)

## Quick Start

We provide plugins for various build platforms to parse and optimize `Gyron` code. For a quick start, you can use the [@gyron/cli](#cli) scaffolding. Below is a TODO application written in `Gyron`.

```tsx
import { useValue, createGyron, FC } from 'gyron'

export const APP = FC(() => {
  const list = useValue<number[]>([])
  function add() {
    list.value.push(Date.now())
  }
  function remove(item: number) {
    const index = list.value.findIndex((value) => value === item)
    list.value.splice(index, 1)
  }
  return (
    <>
      <ul>
        {list.value.map((item) => (
          <li>
            {item} <button onClick={() => remove(item)}>-</button>
          </li>
        ))}
      </ul>
      <button onClick={add} class="add">
        +
      </button>
    </>
  )
})

createGyron(<APP />).render('#app')
```

## Feature

Gyron has done all the expected features, you can refer to [http://gyron.970819.xyz/](http://gyron.970819.xyz/) to see all the feature descriptions.

If you want to see how these features differ from other frameworks in the community you can open Issues to communicate and learn together, or clone the code and see the corresponding module.

### TSC Command

The easiest way to use it is to add the following configuration to tsconfig.json and then add `import { reactCreateElement as h } from '@gyron/jsx-runtime'` to each file.

```json
{
  "compilerOptions": {
    "jsxFactory": "h"
  }
}
```

Or just add `/** @jsx h */` to the file.

```jsx
/** @jsx h */
import { h } from '@gyron/jsx-runtime'

const App = () => {
  return <div>Hello World</div>
}
```

### Use builder

- vite
- webpack
- rollup
- parcel

The current template is based on vite, you can read [jsx](https://gyron.970819.xyz/core/jsx/getting-started) this document when adapting to other platforms, which has updated detailed tutorials.

## Core

The "core" refers to the peripheral ecology that may be used in front-end projects, and the ones listed below are maintained by the author himself.

Among them `router` and `redux` are also runtime code to solve complex projects when the project's routing and state manager.
`dom-client` and `dom-server` correspond to the client-side rendering interface and the server-side rendering interface, respectively.

| Name                                             | Version                                                                                 | Description                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------- |
| [babel-plugin-jsx](./packages/babel-plugin-jsx/) | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/babel-plugin-jsx?style=flat-square) | Convert `jsx` syntax into a runnable expression that generates hot update helper code in the development environment |
| [cli](./packages/cli/)                           | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/cli?style=flat-square)              | Scaffolding for customizable projects                                                                                |
| [dom-client](./packages/dom-client/)             | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/dom-client?style=flat-square)       | Docking browser `document` tools, customizable to access applications that support the `ecma` standard               |
| [dom-server](./packages/dom-server/)             | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/dom-server?style=flat-square)       | Docking server-side `node` tools for server-side rendering                                                           |
| [redux](./packages/redux/)                       | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/redux?style=flat-square)            | Global state manager                                                                                                 |
| [jsx-runtime](./packages/jsx-runtime/)           | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/jsx-runtime?style=flat-square)      | Support for runtimes with `jsx` syntax, such as `babel`'s `transform-react-jsx` plugin                               |
| [reactivity](./packages/reactivity/)             | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/reactivity?style=flat-square)       | Responsive Core                                                                                                      |
| [router](./packages/router/)                     | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/router?style=flat-square)           | route manager                                                                                                        |
| [runtime](./packages/runtime/)                   | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/runtime?style=flat-square)          | renderer and application entry                                                                                       |
| [shared](./packages/shared/)                     | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/shared?style=flat-square)           | public utility functions                                                                                             |
| [sync](./packages/sync/)                         | ![npm (scoped)](https://img.shields.io/npm/v/@gyron/sync?style=flat-square)             | Sync third-party data tool functions to make third-party data responsive                                             | Translated with www.DeepL.com/Translator (free version) |

### CLI

```sh
# global install CLI
npm install @gyron/cli -g
# Create project
gyron create <instance-name>
# Enter the project
cd <instance-name>
# Install dependencies
npm install
# Run
npm run start
```

### Additional Notes

This note is presented in this document as an additional note on top of the MIT base.

The following are additional notes.

```
Any case anyone in the company without the author's authorization is not allowed to release or push as a KPI project, to protect the legitimate rights of open source projects.
```

### SSR

Improve the documentation please read [SSR](https://gyron.970819.xyz/docs/ssr)

### Update the record

For details, see [CHANGELOG.md](. /CHANGELOG.md)

### Test

Please clone the project and run `yarn`, and then `yarn test`.

To learn more, see [https://gyron.970819.xyz/](https://gyron.970819.xyz/).

### Appreciation

If the project is helpful to you, you can star or scan the QR code below on WeChat

![reward](https://s2.loli.net/2022/06/26/njGZ4zv2Te87mhE.webp)
