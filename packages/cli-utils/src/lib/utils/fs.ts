import * as fs from 'fs';
import * as path from 'path';

import * as inquirer from 'inquirer';

import { prettyPath } from './format';
import { promisify } from './promisify';

export const ERROR_FILE_NOT_FOUND = 'FILE_NOT_FOUND';
export const ERROR_FILE_INVALID_JSON = 'FILE_INVALID_JSON';
export const ERROR_OVERWRITE_DENIED = 'OVERWRITE_DENIED';

export interface FSReadFileOptions {
  encoding: string;
  flag?: string;
}

export interface FSWriteFileOptions {
  encoding: string;
  mode?: number;
  flag?: string;
}

export const fsMkdir = promisify<void, string, number>(fs.mkdir);
export const fsStat = promisify<fs.Stats, string>(fs.stat);
export const fsReadFile = promisify<string, string, FSReadFileOptions>(fs.readFile);
export const fsWriteFile = promisify<void, string, any, FSWriteFileOptions>(fs.writeFile);
export const fsReadDir = promisify<string[], string>(fs.readdir);

export async function fsReadJsonFile(filePath: string, options: FSReadFileOptions = { encoding: 'utf8' }): Promise<{ [key: string]: any }> {
  try {
    const f = await fsReadFile(filePath, options);
    return JSON.parse(f);
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw ERROR_FILE_NOT_FOUND;
    } else if (e instanceof SyntaxError) {
      throw ERROR_FILE_INVALID_JSON;
    }

    throw e;
  }
}

export async function fsWriteJsonFile(filePath: string, json: { [key: string]: any}, options: FSWriteFileOptions): Promise<void> {
  return fsWriteFile(filePath, JSON.stringify(json, null, 2), options);
}

export async function fileToString(filepath: string): Promise<string> {
  try {
    return await fsReadFile(filepath, { encoding: 'utf8' });
  } catch (e) {
    if (e.code === 'ENOENT') {
      return '';
    }

    throw e;
  }
}

export async function fsWriteFilePromptOverwrite(p: string, data: any, options: FSWriteFileOptions): Promise<void> {
  let stats: fs.Stats | undefined;

  try {
    stats = await fsStat(p);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  if (stats && stats.isFile()) {
    const confirmation = await inquirer.prompt({
      type: 'confirm',
      name: 'apply',
      message: `File exists: '${prettyPath(p)}'. Overwrite?`
    });

    if (!confirmation['apply']) {
      throw ERROR_OVERWRITE_DENIED;
    }
  }

  return fsWriteFile(p, data, options);
}

export async function fsMkdirp(p: string, mode?: number): Promise<void> {
  if (typeof mode === 'undefined') {
    mode = 0o777 & (~process.umask());
  }

  const absPath = path.resolve(p);
  const pathObj = path.parse(absPath);
  const dirnames = absPath.split(path.sep).splice(1);
  const dirs = dirnames.map((v, i) => path.resolve(pathObj.root, ...dirnames.slice(0, i), v));

  for (let dir of dirs) {
    try {
      await fsMkdir(dir, mode);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }
  }
}
