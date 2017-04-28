import * as fs from 'fs';
import * as path from 'path';

import * as chalk from 'chalk';

import {
  Command,
  CommandLineInputs,
  CommandLineOptions,
  CommandMetadata,
  CommandPreInputsPrompt,
  CommandPreRun,
  getReleaseChannelName,
  pkgInstall,
  prettyPath,
  rimrafp,
  validators,
} from '@ionic/cli-utils';

import {
  isProjectNameValid,
  tarXvfFromUrl,
  isSafeToCreateProjectIn,
  getStarterTemplateTextList,
  getHelloText,
  patchPackageJsonForCli,
  updatePackageJsonForCli,
  createProjectConfig,
} from '../lib/start';

import { load } from '../lib/modules';
import { StarterTemplate } from '../definitions';
import { STARTER_TYPES, STARTER_TEMPLATES } from '../lib/starter-templates';

const IONIC_DASH_URL = 'https://apps.ionic.io';

@CommandMetadata({
  name: 'start',
  type: 'global',
  description: 'Create a new project',
  exampleCommands: [
    '',
    'mynewapp blank',
    'mynewapp tabs --type ionic-angular',
    'mynewapp blank --type ionic1'
  ],
  inputs: [
    {
      name: 'name',
      description: 'The name of your project directory',
      validators: [validators.required],
      prompt: {
        message: 'What would you like to name your project:'
      }
    },
    {
      name: 'template',
      description: `The starter template to use (e.g. ${['blank', 'tabs'].map(t => chalk.green(t)).join(', ')}; use ${chalk.green('--list')} to see all)`,
    }
  ],
  options: [
    {
      name: 'type',
      description: `Type of project to start (e.g. ${STARTER_TYPES.map(st => chalk.green(st.id)).join(', ')})`,
      type: String,
      default: 'ionic-angular'
    },
    {
      name: 'app-name',
      description: 'Human-readable name (use quotes around the name)',
      type: String,
      aliases: ['n']
    },
    {
      name: 'list',
      description:  'List starter templates available',
      type: Boolean,
      aliases: ['l']
    },
    {
      name: 'skip-deps',
      description:  'Skip npm/yarn package installation of dependencies',
      type: Boolean,
    },
    {
      name: 'skip-link',
      description: 'Do not link app to an Ionic Account',
      type: Boolean
    }
  ]
})
export class StartCommand extends Command implements CommandPreRun, CommandPreInputsPrompt {
  async preInputsPrompt() {
    // If the action is list then lets just end here.
    if (this.env.argv['list']) {
      this.env.log.msg(getStarterTemplateTextList(STARTER_TEMPLATES).join('\n'));
      return 0;
    }

    if (this.env.project.directory) {
      const response = await this.env.prompt({
        type: 'confirm',
        name: 'continue',
        message: 'You are already in an Ionic project directory. Do you really want to start another project here?',
        default: false,
      });

      if (!response['continue']) {
        return 0;
      }
    }

  }

  async preRun(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    if (!inputs[1]) {
      const response = await this.env.prompt({
        type: 'list',
        name: 'template',
        message: 'What starter would you like to use:',
        choices: () => {
          const starterTemplates = STARTER_TEMPLATES.filter(st => st.type === options['type']);

          return getStarterTemplateTextList(starterTemplates)
            .map((text: string, index: number) => {
              return {
                name: text,
                short: starterTemplates[index].name,
                value: starterTemplates[index].name
              };
            });
        }
      });

      inputs[1] = response['template'];
    }
  }

  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    let [ projectName, starterTemplateName ] = inputs;
    let appName = <string>options['app-name'] || projectName;
    let cloudAppId = <string>options['cloud-app-id'] || '';
    let starterBranchName = <string>options['starterBranchName'] || 'master';
    let wrapperBranchName = <string>options['wrapperBranchName'] || 'master';
    let projectRoot: string;

    if (!isProjectNameValid(projectName)) {
      throw `Please name your Ionic project something meaningful other than ${chalk.red(projectName)}`;
    }

    projectRoot = path.resolve(projectName);
    projectName = path.basename(projectRoot);

    // Create the project directory
    const pathExists = load('path-exists');
    if (!pathExists.sync(projectName)) {
      this.env.tasks.next(`Creating directory ${chalk.green(projectRoot)}`);
      fs.mkdirSync(projectRoot);
    } else if (!isSafeToCreateProjectIn(projectRoot)) {
      const response = await this.env.prompt({
        type: 'confirm',
        name: 'overwrite',
        message: `The directory ${chalk.green(projectName)} contains file(s) that could conflict. ` +
            'Would you like to overwrite the directory with this new project?'
      });

      if (response['overwrite']) {
        try {
          this.env.tasks.next(`Creating directory ${chalk.green(projectRoot)}`);
          await rimrafp(projectRoot);
          fs.mkdirSync(projectRoot);
        } catch (e) {
          throw e;
        }
      } else {
        throw `\nPlease provide a projectName that does not conflict with this directory.\n`;
      }
    }

    let starterType = STARTER_TYPES.find(type => type['id'] === options['type']);

    if (!starterType) {
      throw `Unable to find starter type for ${options['type']}`;
    }

    let starterTemplateMatches: StarterTemplate[] = STARTER_TEMPLATES.filter(t => t.type === options['type'] && t.name === starterTemplateName);
    let starterTemplate: StarterTemplate | undefined = starterTemplateMatches[0];

    if (starterTemplateMatches.length > 1) {
      starterTemplate = starterTemplateMatches.find(t => t.type === options['type']);
    }

    if (!starterTemplate) {
      throw `Unable to find starter template for ${starterTemplateName}`;
    }

    // Download the starter template, gunzip, and untar into the project folder
    this.env.tasks.next(`Downloading ${chalk.bold(starterTemplateName.toString())} starter template`);

    const wrapperBranchPath = starterType.baseArchive.replace('<BRANCH_NAME>', wrapperBranchName);
    const starterBranchPath = starterTemplate.archive.replace('<BRANCH_NAME>', starterBranchName);

    const extractDir = options['type'] === 'ionic1' ? path.join(projectRoot, 'www') : projectRoot;

    await tarXvfFromUrl(wrapperBranchPath, projectRoot);
    await tarXvfFromUrl(starterBranchPath, extractDir);

    if (options['type'] === 'ionic1') {
      this.env.tasks.next('Downloading resources');
      await tarXvfFromUrl('https://github.com/driftyco/ionic-default-resources/archive/master.tar.gz', path.join(projectRoot, 'resources'));
    }

    this.env.tasks.next(`Updating project dependencies to add required plugins`);

    await patchPackageJsonForCli(appName, starterType, projectRoot);
    await updatePackageJsonForCli(appName, starterType, projectRoot);

    this.env.tasks.next('Creating configuration file for the new project');
    await createProjectConfig(appName, starterType, projectRoot, cloudAppId);

    this.env.tasks.end();

    if (!options['skip-deps']) {
      this.env.log.info('Installing dependencies may take several minutes!');
      const distTag = getReleaseChannelName(this.env.plugins.ionic.version);
      const options = { cwd: projectRoot };

      await pkgInstall(this.env.shell, undefined, options);

      for (let dep of starterType.buildDependencies) {
        await pkgInstall(this.env.shell, `${dep}@${distTag}`, options);
      }
    }

    // Print out hello text about how to get started
    this.env.log.msg(getHelloText());

    // Ask the user if they would like to create a cloud account
    let { cliFlags } = await this.env.config.load();

    if (!options['skip-link']) {
      const { linkApp } = await this.env.prompt({
        type: 'confirm',
        name: 'linkApp',
        message: 'Link this app to your Ionic Dashboard to use tools like Ionic View?'
      });

      if (linkApp && await this.env.session.isLoggedIn()) {
        const opn = load('opn');
        const token = await this.env.session.getUserToken();
        opn(`https://apps.ionic.io/?user_token=${token}`, { wait: false });
        this.env.log.ok(`Run ${chalk.green(`ionic link`)} to link to the app.`);

        opn(IONIC_DASH_URL + '/signup', { wait: false });
      } else if (linkApp) {
        this.env.log.msg(`\nYou will need to login in order to link this app. Please run the following commands to do so.\n` +
          `  ${chalk.green(`ionic login`)} - login first\n` +
          `  ${chalk.green(`ionic link`)} - then link your app`);
      }
    }

    if (!cliFlags.promptedForTelemetry) {
      const { optIn } = await this.env.prompt({
        type: 'confirm',
        name: 'optIn',
        message: 'Would you like to help Ionic improve the CLI by providing anonymous ' +
          'usage and error reporting information?'
      });
      cliFlags.promptedForTelemetry = true;
      cliFlags.enableTelemetry = optIn;
    }

    this.env.log.msg(`\nGo to your newly created project: ${chalk.green(`cd ${prettyPath(projectRoot)}`)}\n`);
  }
}
