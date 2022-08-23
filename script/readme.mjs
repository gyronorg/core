import fs from 'fs'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const root = resolve(__dirname, '../')

const packages = fs.readdirSync(resolve(root, 'packages'))

const action = process.argv[2].slice(1)

packages.forEach((item) => {
  switch (action) {
    case 'c':
      fs.copyFileSync(
        resolve(root, 'README.md'),
        resolve(root, 'packages', item, 'README.md')
      )
      break
    case 'r':
      fs.rmSync(resolve(root, 'packages', item, 'README.md'))
      break
  }
})
