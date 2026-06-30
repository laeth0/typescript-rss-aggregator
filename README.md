# Gator RSS Aggregator

Gator is a multi-user RSS feed aggregator CLI built with TypeScript, PostgreSQL, and Drizzle ORM.

It allows users to register, log in, add RSS feeds, follow feeds, unfollow feeds, aggregate posts from followed feeds, and browse saved posts directly from the terminal.

## Requirements

To run this project, you need:

- Node.js `22.15.0`
- npm
- PostgreSQL `16+`
- A PostgreSQL database named `gator`
- A local config file at `~/.gatorconfig.json`

This project uses:

- TypeScript
- tsx
- PostgreSQL
- Drizzle ORM
- drizzle-kit
- fast-xml-parser

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

Use the correct Node.js version:

```bash
nvm use
```

Install dependencies:

```bash
npm install
```

## Database Setup

Start PostgreSQL:

```bash
sudo service postgresql start
```

Open the PostgreSQL shell:

```bash
sudo -u postgres psql
```

Create the database:

```sql
CREATE DATABASE gator;
ALTER USER postgres PASSWORD 'postgres';
\q
```

Create the local Gator config file:

```bash
cat > ~/.gatorconfig.json <<'EOF'
{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable"
}
EOF
```

Run the database migrations:

```bash
npm run migrate
```

## Usage

All CLI commands are run with:

```bash
npm run start <command>
```

## Commands

### Register a user

```bash
npm run start register lane
```

Creates a new user and sets that user as the current logged-in user.

### Login

```bash
npm run start login lane
```

Logs in as an existing user.

### List users

```bash
npm run start users
```

Example output:

```txt
* lane (current)
* allan
* hunter
```

### Add a feed

```bash
npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"
```

Adds a new RSS feed and automatically follows it for the current user.

### List all feeds

```bash
npm run start feeds
```

Prints all feeds in the database, including the feed name, URL, and the user who added it.

### Follow a feed

```bash
npm run start follow "https://news.ycombinator.com/rss"
```

Follows an existing feed by URL for the current user.

### View followed feeds

```bash
npm run start following
```

Prints the names of all feeds the current user is following.

### Unfollow a feed

```bash
npm run start unfollow "https://news.ycombinator.com/rss"
```

Unfollows a feed by URL for the current user.

### Aggregate feeds

```bash
npm run start agg 1m
```

Starts the feed aggregator. It continuously fetches RSS feeds and stores posts in the database.

Supported duration formats:

```txt
500ms
1s
1m
1h
```

Stop the aggregator with:

```txt
Ctrl+C
```

### Browse posts

```bash
npm run start browse
```

Shows the latest posts from feeds followed by the current user.

By default, it shows 2 posts.

You can pass a custom limit:

```bash
npm run start browse 10
```

### Reset the database

```bash
npm run start reset
```

Deletes all users and related data from the database.

Warning: this is destructive and should only be used during local development or testing.

## Development Scripts

Generate Drizzle migration files:

```bash
npm run generate
```

Run Drizzle migrations:

```bash
npm run migrate
```

Run the CLI:

```bash
npm run start
```

## Example Workflow

```bash
npm run start register lane
npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"
npm run start agg 1m
npm run start browse 5
```

## Notes

Gator is intended for local development and learning purposes.

There is no real authentication system. The current user is stored locally in:

```txt
~/.gatorconfig.json
```

If someone has access to the database and config file, they can act as any user.