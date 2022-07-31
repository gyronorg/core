import { Command } from 'commander'
import { version } from '../package.json'
import { exec } from './core'
import type { Options } from './interface'

const program = new Command()

program.version(version, '-v, --version').usage('<command> [options]')

program
  .command('create <instance-name>')
  .description('Quickly create the scaffolding for the "Gyron" application')
  .allowUnknownOption()
  .option(
    '--preset <presetName>',
    'Use the preset configuration we provide to create the project'
  )
  .option('--default', 'Skip prompts and use default preset', true)
  .option('--debug', 'Skip prompts and use default preset', false)
  .action((name: string, options: Partial<Options>) => {
    exec(name, options)
  })

program.command('clone <repo>').action((repo: string) => {
  exec(repo, {
    clone: true,
    default: true,
  })
})

program.parse(process.argv)
