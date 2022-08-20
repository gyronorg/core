module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [[require('./dist/cjs/index'), { setup: true }]],
}
