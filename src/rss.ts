import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
  }

  const xmlData = await response.text();

  const parser = new XMLParser({
    processEntities: false,
  });

  const parsedData = parser.parse(xmlData);

  if (
    typeof parsedData !== "object" ||
    parsedData === null ||
    typeof parsedData.rss !== "object" ||
    parsedData.rss === null ||
    typeof parsedData.rss.channel !== "object" ||
    parsedData.rss.channel === null
  ) {
    throw new Error("Invalid RSS feed: missing channel");
  }

  const channel = parsedData.rss.channel;

  if (!isValidString(channel.title)) {
    throw new Error("Invalid RSS feed: missing channel title");
  }

  if (!isValidString(channel.link)) {
    throw new Error("Invalid RSS feed: missing channel link");
  }

  if (!isValidString(channel.description)) {
    throw new Error("Invalid RSS feed: missing channel description");
  }

  let rawItems: unknown[] = [];

  if (channel.item !== undefined) {
    if (Array.isArray(channel.item)) {
      rawItems = channel.item;
    } else if (typeof channel.item === "object" && channel.item !== null) {
      rawItems = [channel.item];
    }
  }

  const items: RSSItem[] = [];

  for (const rawItem of rawItems) {
    if (typeof rawItem !== "object" || rawItem === null) {
      continue;
    }

    const item = rawItem as Record<string, unknown>;

    if (
      !isValidString(item.title) ||
      !isValidString(item.link) ||
      !isValidString(item.description) ||
      !isValidString(item.pubDate)
    ) {
      continue;
    }

    items.push({
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate,
    });
  }

  return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: items,
    },
  };
}
