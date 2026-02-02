import { buildAllCaches } from "../cache/buildCache";

interface CacheOptions {
  force: boolean;
  headed: boolean;
  directory: string;
}

function parseArgs(args: string[]): CacheOptions {
  const options: CacheOptions = {
    force: false,
    headed: false,
    directory: "./wallets-cache/",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "-f" || arg === "--force") {
      options.force = true;
    } else if (arg === "--headed") {
      options.headed = true;
    } else if (arg === "-h" || arg === "--help") {
      console.log(`
w3wallets cache - Build wallet caches from setup files

USAGE:
  npx w3wallets cache [OPTIONS] [directory]

ARGUMENTS:
  directory       Directory containing *.cache.{ts,js} files (default: ./wallets-cache/)

OPTIONS:
  -f, --force     Force rebuild even if cache exists
  --headed        Run browser in headed mode
  -h, --help      Show this help message

EXAMPLES:
  npx w3wallets cache                        # Build caches from ./wallets-cache/
  npx w3wallets cache ./tests/setups/        # Custom directory
  npx w3wallets cache --force                # Force rebuild
`);
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      options.directory = arg;
    } else {
      console.error(`Error: Unknown option "${arg}"`);
      process.exit(1);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));

buildAllCaches(options.directory, {
  force: options.force,
  headed: options.headed,
}).catch((err) => {
  console.error(`Cache build failed: ${err.message}`);
  process.exit(1);
});
