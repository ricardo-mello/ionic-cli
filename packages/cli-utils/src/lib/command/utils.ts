import * as chalk from 'chalk';

import * as dargsType from 'dargs';
import * as inquirerType from 'inquirer';

import {
  CommandData,
  CommandOption,
  CommandLineInput,
  CommandLineOptions,
  CommandOptionType,
  CommandOptionTypeDefaults,
  IonicEnvironment,
  NormalizedCommandOption,
  NormalizedMinimistOpts,
  Validator,
} from '../../definitions';

import { validate, validators } from '../validators';
import { load } from '../modules';

const typeDefaults: CommandOptionTypeDefaults = new Map<CommandOptionType, CommandLineInput>()
  .set(String, null)
  .set(Boolean, false);

export function minimistOptionsToArray(options: CommandLineOptions, dargsOptions: dargsType.Opts = {}): string[] {
  const dargs = load('dargs');

  if (typeof dargsOptions.ignoreFalse === 'undefined') {
    dargsOptions.ignoreFalse = true;
  }

  const results = dargs(options, dargsOptions);
  results.splice(results.length - options._.length); // take out arguments

  return results;
}

/**
 * Takes a Minimist command option and normalizes its values.
 */
function normalizeOption(option: CommandOption): NormalizedCommandOption {

  if (!option.type) {
    option.type = String;
  }

  if (!option.default) {
    option.default = typeDefaults.get(option.type);
  }

  if (!option.aliases) {
    option.aliases = [];
  }

  return option as NormalizedCommandOption;
}

export function metadataToMinimistOptions(metadata: CommandData): NormalizedMinimistOpts {
  let options: NormalizedMinimistOpts = {
    string: [],
    boolean: [],
    alias: {},
    default: {}
  };

  if (!metadata.options) {
    return options;
  }

  for (let option of metadata.options.map(o => normalizeOption(o))) {
    if (option.type === String) {
      options.string.push(option.name);
    } else if (option.type === Boolean) {
      options.boolean.push(option.name);
    }

    options.default[option.name] = option.default;
    options.alias[option.name] = option.aliases;
  }

  return options;
}

export function validateInputs(argv: string[], metadata: CommandData) {
  if (!metadata.inputs) {
    return;
  }

  for (let i in metadata.inputs) {
    const input = metadata.inputs[i];

    if (argv[i] && input.validators) { // only run validators if input given
      validate(argv[i], input.name, input.validators);
    }
  }
}

export function filterOptionsByIntent(metadata: CommandData, options: CommandLineOptions, intentName?: string): CommandLineOptions {
  const r = Object.keys(options).reduce((allOptions, optionName) => {
    const metadataOptionFound = (metadata.options || []).find((mdOption) => (
      mdOption.name === optionName || (mdOption.aliases || []).includes(optionName)
    ));
    if (metadataOptionFound) {
      if (intentName && metadataOptionFound.intent === intentName) {
        allOptions[optionName] = options[optionName];
      } else if (!intentName && !metadataOptionFound.intent) {
        allOptions[optionName] = options[optionName];
      }
    }
    return allOptions;
  }, <CommandLineOptions>{});

  r._ = options._;
  r['--'] = options['--'];

  return r;
}
