import * as path from 'path';
import * as chalk from 'chalk';

import { Namespace, FatalException } from '@ionic/cli-utils';
import { IonicNamespace } from '../commands';
import * as globalPlugin from '../index';

export const defaultPlugin = 'core';
export const knownPlugins = new Set<string>(['cloud', 'cordova']);
export const PREFIX = '@ionic/cli-plugin-';
export const ERROR_PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND';
export const ERROR_PLUGIN_INVALID = 'PLUGIN_INVALID';

function isNamespace(m: any): m is typeof Namespace {
  return m.prototype instanceof Namespace; // TODO: is this dangerous?
}

/**
 * Synchronously load a plugin
 */
export function loadPlugin(name: string): typeof Namespace {
  let m: any;

  try {
    var mPath = require.resolve(path.join(process.cwd(), 'node_modules', `${PREFIX}${name}`));
    m = require(mPath);
  } catch (e) {
    console.log(e);
    if (e.code === 'MODULE_NOT_FOUND') {
      throw ERROR_PLUGIN_NOT_FOUND;
    }

    throw e;
  }

  if (!isNamespace(m.default)) {
    throw ERROR_PLUGIN_INVALID;
  }

  return m.default;
}

/**
 * Get inputs and command class based on arguments supplied
 */
export function resolvePlugin(argv: string[]): any {
  let pluginName: string;

  /**
   * If the first arguement supplied contains a ':' then
   * it is assumed that this is calling a command in another
   * namespace. <namespaceName>:<commandName>
   *
   * If there is no namespaceName assume it lives in 'core'.
   *
   */
  const isGlobalCmd = IonicNamespace.getCommandNames().has(argv[0]);
  if (isGlobalCmd || argv.length === 0) {
    return globalPlugin;
  }

  if (argv.length > 0 && argv[0].indexOf(':') !== -1) {
    pluginName = argv[0].split(':')[0];
  } else {
    pluginName = defaultPlugin;
  }

  /**
   * Load the namespace using the namespaceName provided
   */
  try {
    return loadPlugin(pluginName);
  } catch (e) {

    /**
     * If plugin is not found then lets make a recommendation
     * based on whether we know the plugin exists.
     */
    if (e === ERROR_PLUGIN_NOT_FOUND) {
      if (knownPlugins.has(pluginName)) {
        throw new FatalException('This plugin is not currently installed. Please execute the following to install it.\n'
                                + `    ${chalk.bold(`npm install ${PREFIX}${pluginName}`)}`);
      } else {
        throw new FatalException(`Unknown plugin: ${chalk.bold(PREFIX + pluginName)}.`);
      }
    }

    throw e;
  }
}
