import { readConfig, setUser } from "./config";
import { fetchFeed } from "./rss";
import {
  createFeedFollow,
  getFeedFollowsForUser,
} from "./lib/db/queries/feedFollows";
import { createFeed, getFeedByUrl, getFeeds } from "./lib/db/queries/feeds";
import {
  createUser,
  deleteUsers,
  getUser,
  getUsers,
} from "./lib/db/queries/users";
import type { Feed, User } from "./lib/db/schema";

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

async function getCurrentUser(): Promise<User> {
  const cfg = readConfig();

  if (!cfg.currentUserName) {
    throw new Error("No current user is set. Please login or register first.");
  }

  const user = await getUser(cfg.currentUserName);

  if (!user) {
    throw new Error(`Current user ${cfg.currentUserName} does not exist`);
  }

  return user;
}

export function printFeed(feed: Feed, user: User): void {
  console.log("Feed:");
  console.log(`  ID: ${feed.id}`);
  console.log(`  Created: ${feed.createdAt}`);
  console.log(`  Updated: ${feed.updatedAt}`);
  console.log(`  Name: ${feed.name}`);
  console.log(`  URL: ${feed.url}`);
  console.log(`  User: ${user.name}`);
}

export function printFeedFollow(feedName: string, userName: string): void {
  console.log(`Feed: ${feedName}`);
  console.log(`User: ${userName}`);
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

export async function handlerUsers(): Promise<void> {
  const cfg = readConfig();
  const users = await getUsers();

  for (const user of users) {
    if (user.name === cfg.currentUserName) {
      console.log(`* ${user.name} (current)`);
      continue;
    }

    console.log(`* ${user.name}`);
  }
}

export async function handlerAgg(): Promise<void> {
  const feed = await fetchFeed("https://www.wagslane.dev/index.xml");

  console.dir(feed, { depth: null });
}

export async function handlerAddFeed(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error(`The ${cmdName} command requires a feed name and URL`);
  }

  const [name, url] = args;
  const user = await getCurrentUser();

  const feed = await createFeed(name, url, user.id);
  const feedFollow = await createFeedFollow(user.id, feed.id);

  printFeed(feed, user);
  printFeedFollow(feedFollow.feedName, feedFollow.userName);
}

export async function handlerFeeds(): Promise<void> {
  const feeds = await getFeeds();

  for (const row of feeds) {
    printFeed(row.feeds, row.users);
  }
}

export async function handlerFollow(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error(`The ${cmdName} command requires a feed URL`);
  }

  const url = args[0];
  const user = await getCurrentUser();
  const feed = await getFeedByUrl(url);

  if (!feed) {
    throw new Error(`Feed with URL ${url} does not exist`);
  }

  const feedFollow = await createFeedFollow(user.id, feed.id);

  printFeedFollow(feedFollow.feedName, feedFollow.userName);
}

export async function handlerFollowing(): Promise<void> {
  const user = await getCurrentUser();
  const feedFollows = await getFeedFollowsForUser(user.id);

  for (const feedFollow of feedFollows) {
    console.log(feedFollow.feedName);
  }
}

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", handlerAddFeed);
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", handlerFollow);
  registerCommand(registry, "following", handlerFollowing);

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
