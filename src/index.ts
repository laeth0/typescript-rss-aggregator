import { setUser } from "./config";

export type CommandHandler = (cmdName: string, ...args: string[]) => void;

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

export function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): void {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  handler(cmdName, ...args);
}

export function handlerLogin(cmdName: string, ...args: string[]): void {
  if (args.length === 0) {
    throw new Error(`The ${cmdName} command requires a username`);
  }

  const username = args[0];

  setUser(username);

  console.log(`User set to ${username}`);
}

function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);

  const cliArgs = process.argv.slice(2);

  if (cliArgs.length < 1) {
    console.error("Error: not enough arguments were provided");
    process.exit(1);
  }

  const [cmdName, ...args] = cliArgs;

  try {
    runCommand(registry, cmdName, ...args);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Error: something went wrong");
    }

    process.exit(1);
  }
}

main();
