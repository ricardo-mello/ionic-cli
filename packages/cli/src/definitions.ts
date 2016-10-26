import * as minimist from 'minimist';
import * as inquirer from 'inquirer';
import * as superagent from 'superagent';

export interface SuperAgentError extends Error {
  response: superagent.Response;
}

export type LogFn = (message?: any, ...args: any[]) => void;

export interface LoggerOptions {
  level: string;
  prefix: string;
}

export interface ILogger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  msg: Function;
}

export interface ProjectFile {
  name: string;
  app_id?: string;
  [key: string]: any;
}

export interface IProject {
  directory: string;

  load(): Promise<ProjectFile>;
  save(projectFile: ProjectFile): Promise<void>;
}

export type CommandLineInput = string | boolean | null;
export type CommandLineInputs = string[];
export type CommandLineOptions = { [arg: string]: CommandLineInput };
export type CommandOptionType = StringConstructor | BooleanConstructor;
export type CommandOptionTypeDefaults = Map<CommandOptionType, CommandLineInput>;

export interface CommandOption {
  name: string;
  description: string;
  type?: CommandOptionType;
  default?: CommandLineInput;
  aliases?: string[];
}

export interface NormalizedCommandOption extends CommandOption {
  type: CommandOptionType;
  default: CommandLineInput;
  aliases: string[];
}

export type Validator = (input: string, key?: string) => boolean | string;

export interface Validators {
  required: Validator;
  email: Validator;
}

export interface CommandInputPrompt {
  type?: string;
  message?: string;
  choices?: inquirer.ChoiceType[] | ((answers: inquirer.Answers) => inquirer.ChoiceType[]);
  filter?(input: string): string;
}

export interface CommandInput {
  name: string;
  description: string;
  prompt?: CommandInputPrompt;
  validators?: Validator[];
}

export interface CommandData {
  name: string;
  description: string;
  aliases?: string[];
  subcommands?: ICommandMap;
  isProjectTask: boolean;
  inputs?: CommandInput[];
  options?: CommandOption[];
}

export type TokenType = 'user';

export interface ISession {
  login(email: string, password: string): Promise<void>;
  getToken(type?: TokenType): Promise<string>;
}

export interface ConfigFile {
  lastUpdated: string;
  token?: string;
  urls: {
    api: string;
  };
}

export interface IConfig {
  env: { [k: string]: string };

  load(): Promise<ConfigFile>;
  save(configFile: ConfigFile): Promise<void>;
}

export interface CommandEnvironment {
  argv: minimist.ParsedArgs;
  commands: ICommandMap;
  client: IClient;
  config: IConfig;
  log: ILogger;
  modules: {
    inquirer: typeof inquirer
  };
  project: IProject;
  session: ISession;
}

export interface ICommand {
  metadata: CommandData;
  env: CommandEnvironment;

  execute(env: CommandEnvironment): Promise<void>;
  run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void>;
}

export interface ICommandMap extends Map<string, ICommand> {
  resolve(argv: string[], opts?: { stopOnUnknown: boolean }): [string[], ICommand | undefined];
}

export type APIResponse = APIResponseSuccess | APIResponseError;

export interface APIResponseMeta {
  status: number;
  version: string;
  request_id: string;
}

export type APIResponseData = Object | Object[];

export interface APIResponseErrorDetails {
  error_type: string;
  parameter: string;
  errors: string[];
}

export interface APIResponseError {
  error: APIResponseErrorError;
  meta: APIResponseMeta;
}

export interface APIResponseErrorError {
  message: string;
  link: string | null;
  type: string;
  details?: APIResponseErrorDetails[];
}

export interface APIResponseSuccess {
  data: APIResponseData;
  meta: APIResponseMeta;
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'PURGE' | 'HEAD' | 'OPTIONS';

export interface IClient {
  make(method: HttpMethod, path: string): superagent.Request;
  do(res: superagent.Request): Promise<APIResponseSuccess>;
}

export interface PluginModule {
  getCommands(): ICommandMap;
}
