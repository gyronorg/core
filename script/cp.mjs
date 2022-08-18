import fs from 'fs'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const root = resolve(__dirname, '../')

const packages = fs.readdirSync(resolve(root, 'packages'))

packages.forEach((item) => {
  fs.copyFileSync(
    resolve(root, 'README.md'),
    resolve(root, 'packages', item, 'README.md')
  )
})
