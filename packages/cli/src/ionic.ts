export * from './definitions';

import * as minimist from 'minimist';
import * as chalk from 'chalk';
import getCommands from './commands';
import { Command, CommandMetadata } from './lib/command';
import { CommandMap, ICommand } from './definitions';
import { ERROR_PLUGIN_NOT_FOUND, PluginLoader } from './lib/utils/plugins';
import { Logger } from './lib/utils/logger';
import { metadataToOptimistOptions } from './lib/utils/commandOptions';
import { Project } from './lib/utils/project';

export { Command as Command, CommandMetadata as CommandMetadata }

const defaultCommand = 'help';

function getCommand(name: string, commands: CommandMap): ICommand {
  const loader = new PluginLoader();
  let command: ICommand | undefined;

  /*
   * Each plugin can register its namespace and its commands.
   * - Should we allow a plugin to register its command without a namespace?
   *  - If so only Ionic specific plugins
   * Each plugin must have a namespace
   * Each command is called with specific environment information
   */

  /**
   * Check if command exists local to this package
   */
  if (commands.has(name)) {
    command = commands.get(name);

  /**
   * Check if command exists as a plugin
   * - Each npm package is named as @ionic/cli-plugin-<name>
   * - Each plugin command is prefixed with <plugin name>:
   */
  } else if (name && name.indexOf(':') !== -1) {
    const [pluginName, pluginCommand] = name.split(':');

    try {
      command = loader.load(pluginName).get(pluginCommand);

    /**
     * If command does not exist then lets show them help
     */
    } catch (e) {
      if (e === ERROR_PLUGIN_NOT_FOUND && loader.has(pluginName)) {
        throw new Error(`
  This plugin is not currently installed. Please execute the following to install it.

      ${chalk.bold(`npm install ${loader.prefix}${pluginName}`)}
  `);
      }

      throw e;
    }
  }

  if (!command) {
    command = commands.get(defaultCommand);

    if (!command) {
      throw new Error('Missing default command.');
    }
  }

  return command;
}

export async function run(pargv: string[]) {

  // Check version?
  const argv = minimist(pargv.slice(2));
  const commands = getCommands();

  // Global CLI option setup
  const logLevel: string = argv['loglevel'] || 'warn';
  const log = new Logger({ level: logLevel, prefix: '' });

  const project = new Project('.');
  const command = getCommand(argv._[0], commands);

  async function runCommand(cmd: ICommand) {
    log.info('executing', cmd.metadata.name);

    const options = metadataToOptimistOptions(cmd.metadata);
    const argv = minimist(pargv.slice(3), options);

    try {
      await cmd.run({
        commands,
        inputs: argv._,
        log,
        options: argv,
        project
      });
    } catch (e) {
      log.error(e);
      process.exit(1); // TODO
    }
  }

  await runCommand(command);
}
