import { Options } from './interface'
import download from 'download-git-repo'
import ora from 'ora'
import chalk from 'chalk'

export function exec(name: string, options: Partial<Options>) {
  if (options.default) {
    const spinner = ora('download template...').start()
    const repoName = options.clone ? name : 'gyronorg/template'
    download(repoName, name, (err) => {
      if (err) {
        spinner.fail(err)
        return null
      }
      spinner.succeed('download successful')
      console.log()
      console.log(`
${chalk.bold('Project creation is complete.')}

Next, go to the ${chalk.underline.bold.blue(name)} directory and execute

  * ${chalk.green('yarn install')}

To run the project, run

  * ${chalk.green('yarn start')}
`)
    })
  } else {
    console.warn('Customization options do not exist at this time')
  }
}
