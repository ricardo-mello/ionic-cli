import * as inquirer from 'inquirer';
import * as superagent from 'superagent';

export interface SuperAgentError extends Error {
  response: superagent.Response;
}

export type LogFn = (message?: any, ...args: any[]) => void;

export type LogLevel = 'debug' | 'info' | 'ok' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
}

export interface ILogger {
  level: string;
  prefix: string;

  debug: LogFn;
  info: LogFn;
  ok: LogFn;
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

export interface IConfig<T> {
  load(): Promise<T>;
  save(configFile: T): Promise<void>;
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

export interface IIonicNamespaceRunOptions {
  showCommand?: boolean;
}

export interface IIonicNamespace {
  run(pargv: string[], opts?: IIonicNamespaceRunOptions): Promise<void>;
  resolve(argv: string[]): [string[], ICommand | undefined];
}

export interface CommandEnvironment {
  pargv: string[];
  client: IClient;
  config: IConfig<ConfigFile>;
  inquirer: typeof inquirer;
  log: ILogger;
  project: IProject;
  session: ISession;
}

export interface INamespace {
  name: string;
  getNamespaces(): INamespaceMap;
  getCommands(): ICommandMap;
}

export interface ICommand {
  cli: IIonicNamespace;
  env: CommandEnvironment;
  metadata: CommandData;

  run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void | number>;
  execute(cli: IIonicNamespace, env: CommandEnvironment, inputs?: CommandLineInputs): Promise<void>;
}

export interface INamespaceMap extends Map<string, INamespace> {}
export interface ICommandMap extends Map<string, ICommand> {}
