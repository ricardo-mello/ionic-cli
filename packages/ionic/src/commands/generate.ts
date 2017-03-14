import {
  CommandLineInputs,
  CommandLineOptions,
  Command,
  CommandMetadata,
  TaskChain,
  validators,
} from '@ionic/cli-utils';

import * as path from 'path';

import { load } from '../lib/utils/commonjs-loader';

@CommandMetadata({
  name: 'generate',
  aliases: ['g'],
  description: 'Generate pages and components',
  inputs: [
    {
      name: 'type',
      description: 'The type of generator that you would like to use',
      validators: [validators.required],
      prompt: {
        type: 'list',
        message: 'What would you like to generate:',
        choices: ['component', 'directive', 'page', 'pipe', 'provider', 'tabs']
      }
    },
    {
      name: 'name',
      description: 'The name of the file that gets generated',
      validators: [validators.required],
      prompt: {
        message: 'What would you like the name of this file to be:'
      }
    }
  ],
  requiresProject: true
})
export class GenerateCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
    const [ type, name ] = inputs;
    const tasks = new TaskChain();

    let context;

    process.argv = ['node', 'appscripts'];
    const appScripts = load('@ionic/app-scripts');

    switch (type) {
      case 'page':
        context = appScripts.generateContext();
        tasks.next('Generating');

        await appScripts.processPageRequest(context, name);
        break;
      case 'component':
        context = appScripts.generateContext();
        const componentData = await this.genComponent(context, appScripts);

        tasks.next('Generating');
        await appScripts.processComponentRequest(context, name, componentData);
        break;
      case 'directive':
        context = appScripts.generateContext();
        const directiveData = await this.genDirective(context, appScripts);

        tasks.next('Generating');
        await appScripts.processDirectiveRequest(context, name, directiveData);
        break;
      case 'pipe':
        context = appScripts.generateContext();
        const pipeData = await this.genPipe(context, appScripts);

        tasks.next('Generating');
        await appScripts.processPipeRequest(context, name, pipeData);
        break;
      case 'provider':
        context = appScripts.generateContext();
        const providerData = await this.genProvider(context, appScripts);

        tasks.next('Generating');
        await appScripts.processProviderRequest(context, name, providerData);
      case 'tabs':
        context = appScripts.generateContext();
        tasks.next('Generating');

        await appScripts.processTabsRequest(context, name);
    }

    tasks.end();
  }

  private async genPipe(context: any, appScripts: any) {
    const pipeUsage = await this.env.inquirer.prompt({
      type: 'confirm',
      name: 'pipeUsage',
      message: 'Will this pipe be used in more than one template?'
    });

    if (!pipeUsage.pipeUsage) {
      const fileChoices = await this.getPages(appScripts, context);

      const pipePlaces = await this.env.inquirer.prompt({
        type: 'list',
        name: 'whereUsed',
        message: 'Which page or component will be using this pipe?',
        choices: fileChoices
      });

      return [pipeUsage, pipePlaces];
    } else {
      return [pipeUsage];
    }
  }

  private async genProvider(context: any, appScripts: any) {
    const providerUsage = await this.env.inquirer.prompt({
      type: 'confirm',
      name: 'providerUsage',
      message: 'Will this provider be used in more than one template?'
    });

    if (!providerUsage.providerUsage) {
      const fileChoices = await this.getPages(appScripts, context);

      const providerPlaces = await this.env.inquirer.prompt({
        type: 'list',
        name: 'whereUsed',
        message: 'Which page or component will be using this provider?',
        choices: fileChoices
      });

      return [providerUsage, providerPlaces];
    } else {
      return [providerUsage];
    }
  }

  private async genDirective(context: any, appScripts: any) {
    const directiveUsage = await this.env.inquirer.prompt({
      type: 'confirm',
      name: 'directiveUsage',
      message: 'Will this directive be used in more than one template?'
    });

    if (!directiveUsage.directiveUsage) {
      const fileChoices = await this.getPages(appScripts, context);

      const directivePlaces = await this.env.inquirer.prompt({
        type: 'list',
        name: 'whereUsed',
        message: 'Which page or component will be using this directive?',
        choices: fileChoices
      });

      return [directiveUsage, directivePlaces];
    } else {
      return [directiveUsage];
    }
  }

  private async genComponent(context: any, appScripts: any) {
    const componentUsage = await this.env.inquirer.prompt({
      type: 'confirm',
      name: 'componentUsage',
      message: 'Will this component be used in more than one template?'
    });

    if (!componentUsage.componentUsage) {
      const fileChoices = await this.getPages(appScripts, context);

      const componentPlaces = await this.env.inquirer.prompt({
        type: 'list',
        name: 'whereUsed',
        message: 'Which page or component will be using this component?',
        choices: fileChoices
      });

      return [componentUsage, componentPlaces];
    } else {
      return [componentUsage];
    }
  }

  private async getPages(appScripts: any, context: any) {
    const fileChoices: string[] = [];

    const pages = await appScripts.getNgModules(context, ['page', 'component']);

    pages.forEach((page: any) => {
      fileChoices.push(path.basename(page.absolutePath, '.module.ts'));
    });

    return fileChoices;
  }
}


