/** @param {string[]} files */
function test(files) {
  const packages = files
    .map((file) => {
      return {
        name: file.match(/packages\/(?<package>.+)\/tests/)?.groups?.package,
        file: file,
      }
    })
    .filter((x) => Boolean(x.name))
    .reduce((prev, cur) => {
      if (cur.name) {
        if (prev[cur.name]) {
          prev[cur.name].push(cur.file)
        } else {
          prev[cur.name] = [cur.file]
        }
      }
      return prev
    }, {})

  const plugin = Object.entries(packages).filter(
    ([key]) => key === 'babel-plugin-jsx'
  )
  const other = Object.entries(packages)
    .filter(([key]) => key !== 'babel-plugin-jsx')
    .map(([_, v]) => v)

  return [
    plugin.length
      ? `jest --config packages/${plugin[0][0]}/jest.config.js ${plugin[0][1].join(
          ' '
        )}`
      : null,
    other.length
      ? `jest --config jest.config.js --colors ${other.join(' ')}`
      : null,
  ].filter(Boolean)
}

const lint = {
  '**/*.(js|jsx|ts|tsx)': ['prettier --write', 'eslint --fix'],
  '**/*.spec.(ts|tsx)': test,
}

export default lint
