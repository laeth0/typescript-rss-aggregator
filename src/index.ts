import { setUser } from "./config";
import { createUser, deleteUsers, getUser } from "./lib/db/queries/users";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}

export async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error(`The ${cmdName} command requires a username`);
  }

  const username = args[0];
  const user = await getUser(username);

  if (!user) {
    throw new Error(`User ${username} does not exist`);
  }

  setUser(username);

  console.log(`User set to ${username}`);
}

export async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error(`The ${cmdName} command requires a username`);
  }

  const username = args[0];
  const existingUser = await getUser(username);

  if (existingUser) {
    throw new Error(`User ${username} already exists`);
  }

  const user = await createUser(username);

  setUser(username);

  console.log(`User ${username} created`);
  console.log(user);
}

export async function handlerReset(): Promise<void> {
  await deleteUsers();

  console.log("Users table reset successfully");
}

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);

  const cliArgs = process.argv.slice(2);

  if (cliArgs.length < 1) {
    console.error("Error: not enough arguments were provided");
    process.exit(1);
  }

  const cmdName = cliArgs[0];
  const args = cliArgs.slice(1);

  try {
    await runCommand(registry, cmdName, ...args);
    process.exit(0);
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
