import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as tar from 'tar';
import * as chalk from 'chalk';
import fetch from 'node-fetch';

import {
  runcmd,
  getCommandInfo,
  fsReadJsonFile,
  fsWriteJsonFile,
  ERROR_FILE_NOT_FOUND,
  ERROR_FILE_INVALID_JSON
} from '@ionic/cli-utils';
import { StarterTemplate, StarterTemplateType } from '../definitions';

const STARTER_CACHE_DIR = 'archives';

/**
 * Spawn an npm install task from within
 */
export async function pkgInstallProject(installer: string, root: string): Promise<any> {
  try {
    await runcmd(installer, ['install'], {cwd: root, stdio: 'ignore'});
  } catch (e) {
    throw `${installer} install failed`;
  }
}

/*
export function storeInCache(readStream: NodeJS.ReadableStream, configDirectory: string, starterTemplate: StarterTemplate) {
  const [templateOrgId, templateProjectName] = starterTemplate.path.split('/');
  const templateCacheDir = path.resolve(configDirectory, STARTER_CACHE_DIR, templateOrgId);

  return writeStreamToFile(readStream, );
}
*/

// TODO: Make Use of this function with storeInCache
export async function shouldUseCache(configDirectory: string, starterTemplate: StarterTemplate, starterType: StarterTemplateType) {
  const [templateOrgId, templateProjectName] = starterTemplate.path.split('/');
  const templateCacheDir = path.resolve(configDirectory, STARTER_CACHE_DIR, templateOrgId);

  // Check to see if cache files even exists.

  // Check Etag from github to decide if we need to use a new download or to use the cache
  try {
    let [ baseArchiveResponse, archiveResponse] = await Promise.all([
      fetch(starterType.baseArchive, { method: 'HEAD' }),
      fetch(starterTemplate.archive, { method: 'HEAD' })
    ]);

    console.log(templateCacheDir, templateProjectName);
    console.log(baseArchiveResponse.headers.get('Etag'));
    console.log(archiveResponse.headers.get('Etag'));
  } catch (e) {
    if (['ETIMEOUT', 'ENOTFOUND'].includes(e.code)) {
      return true;
    }
    console.log('finally');
  }
}

/**
 *
 */
export function tarXvf(readStream: NodeJS.ReadableStream, destination: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const baseArchiveExtract = tar.Extract({
        path: destination,
        strip: 1
      })
      .on('error', reject)
      .on('end', resolve);
    try {
      readStream
        .pipe(zlib.createUnzip())
        .on('error', reject)
        .pipe(baseArchiveExtract);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 *
 */
export function isProjectNameValid(name: string): boolean {
  return name !== '.';
}

/**
 * If project only contains files generated by GH, it’s safe.
 * We also special case IJ-based products .idea because it integrates with CRA:
 * https://github.com/facebookincubator/create-react-app/pull/368#issuecomment-243446094
 */
export function isSafeToCreateProjectIn(root: string): boolean {
  var validFiles = [
    '.DS_Store', 'Thumbs.db', '.git', '.gitignore', '.idea', 'README.md', 'LICENSE'
  ];
  return fs.readdirSync(root)
    .every(function(file) {
      return validFiles.indexOf(file) >= 0;
    });
}

/**
 *
 */
export function getStarterTemplateText(templateList: StarterTemplate[]): string {
  let headerLine = chalk.bold(`Ionic Starter templates`);
  let formattedTemplateList = getStarterTemplateTextList(templateList);


  return `
    ${headerLine}
      ${formattedTemplateList.join(`
      `)}
  `;
}

export function getStarterTemplateTextList(templateList: StarterTemplate[]): string[] {

  return templateList.map(({ name, typeId, description }) => {
    let templateName = chalk.green(name);

    return `${templateName} ${Array(20 - name.length).join('.')} ${chalk.bold(typeId)} ${description}`;
  });
}

/**
 *
 */
export function getHelloText(): string {
  return `
${chalk.bold('♬ ♫ ♬ ♫  Your Ionic app is ready to go! ♬ ♫ ♬ ♫')}

${chalk.bold('Run your app in the browser (great for initial development):')}
  ${chalk.green('ionic serve')}

${chalk.bold('Run on a device or simulator:')}
  ${chalk.green('ionic cordova:run ios')}

${chalk.bold('Test and share your app on a device with the Ionic View app:')}
  ${chalk.green('http://view.ionic.io')}
  `;
}

export async function updatePackageJsonForCli(appName: string, starterType: StarterTemplateType, pathToProject: string, releaseChannelName: string = 'latest'): Promise<void> {
  const filePath = path.resolve(pathToProject, 'package.json');
  const distTagPromises = starterType.buildDependencies.map(stDependency => (
    getCommandInfo('npm', ['view', stDependency, 'dist-tags', '--json'])
  ));

  try {
    let jsonStructure = await fsReadJsonFile(filePath);
    let distTags = await Promise.all(distTagPromises);

    jsonStructure['name'] = appName;
    jsonStructure['version'] = '0.0.1';
    jsonStructure['description'] = 'An Ionic project';

    starterType.buildDependencies.forEach((stDependency, index) => {
      jsonStructure['devDependencies'][stDependency] = JSON.parse(distTags[index])[releaseChannelName];
    });

    await fsWriteJsonFile(filePath, jsonStructure, { encoding: 'utf8' });

  } catch (e) {
    if (e === ERROR_FILE_NOT_FOUND) {
      throw new Error(`${filePath} not found`);
    } else if (e === ERROR_FILE_INVALID_JSON) {
      throw new Error(`${filePath} is not valid JSON.`);
    }
    throw e;
  }
}

export async function createProjectConfig(appName: string, starterType: StarterTemplateType, pathToProject: string, cloudAppId: string): Promise<void> {
  const filePath = path.resolve(pathToProject, 'ionic.config.json');
  const jsonStructure = {
    name: appName,
    app_id: cloudAppId,
    projectTypeId: starterType.id
  };

  await fsWriteJsonFile(filePath, jsonStructure, { encoding: 'utf8' });
}
