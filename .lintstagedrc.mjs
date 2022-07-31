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

  return Object.entries(packages).map(
    ([key, value]) =>
      `jest --config packages/${key}/jest.config.js ${value.join(' ')}`
  )
}

const lint = {
  '**/*.(js|jsx|ts|tsx)': ['prettier --write', 'eslint --fix'],
  '**/*.spec.(ts|tsx)': test,
}

export default lint
