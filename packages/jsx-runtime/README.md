# jsx-runtime

支持 `jsx` 语法的运行时，比如 `babel` 的 `transform-react-jsx` 插件

## 配置

```js
module.exports = {
  plugins: [
    [
      '@babel/plugin-transform-react-jsx',
      {
        importSource: '@gyron',
        pragma: 'reactCreateElement',
        pragmaFrag: 'Fragment',
      },
    ],
  ],
}
```

更多信息请参考官方文档 [https://gyron.cc/](https://gyron.cc/)
