import * as os from 'os';
import * as path from 'path';

import { ConfigFile, IConfig } from '../definitions';
import { readJsonFile, writeJsonFile, validate } from './utils/json';

const CONFIG_FILE = 'config.json';
const CONFIG_DIRECTORY = path.resolve(os.homedir(), '.ionic');
const CONFIG_IONIC_API = 'https://api.ionic.io';

function isConfigFile(j: { [key: string]: any }): j is ConfigFile {
  return j['lastUpdated'] !== undefined;
}

export class Config implements IConfig {
  public directory: string;
  public configFilePath: string;

  protected configFile?: ConfigFile;

  constructor(public env: { [k: string]: string }) {
    this.directory = this.env['IONIC_DIRECTORY'] || CONFIG_DIRECTORY;
    this.configFilePath = path.resolve(this.directory, CONFIG_FILE);
  }

  async load(): Promise<ConfigFile> {
    if (!this.configFile) {
      let o = await readJsonFile(this.configFilePath);

      if (validate<ConfigFile>(o, isConfigFile)) {
        this.configFile = o;
      } else {
        throw 'todo'; // TODO
      }
    }

    return this.configFile;
  }

  async save(configFile: ConfigFile): Promise<void> {
    await writeJsonFile(configFile, this.configFilePath);
    this.configFile = configFile;
  }
}
