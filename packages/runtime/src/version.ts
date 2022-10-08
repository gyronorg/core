import { version } from '../package.json'

export function checkVersion() {
  if (__WARN__ && (version.includes('alpha') || version.includes('beta'))) {
    console.warn(
      `The current(${version}) version is not available for production environments. Please use the command "npm install gyron@latest" to upgrade`
    )
  }
}
