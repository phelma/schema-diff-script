import minimist from "minimist";
import { runHtmlDiff } from "./src/html-diff";
import { runSchemaDiff } from "./src/schema-diff";
import { colorize } from "./src/utils";

/**
 * Main function
 */
async function main() {
  const args = minimist(process.argv.slice(2));

  const mode = args.mode || "schema";
  const positionalArgs = args._;

  let url1: string;
  let url2: string;

  if (positionalArgs.length === 2) {
    // Format: url1 url2
    const [arg1, arg2] = positionalArgs;
    if (!arg1 || !arg2) {
      console.error(colorize.error("Error: Both URLs must be provided"));
      process.exit(1);
    }
    url1 = arg1;
    url2 = arg2;
  } else if (positionalArgs.length === 3) {
    // Format: host1 host2 path
    const [arg1, arg2, arg3] = positionalArgs;
    if (!arg1 || !arg2 || !arg3) {
      console.error(
        colorize.error(
          "Error: All three arguments (host1, host2, path) must be provided"
        )
      );
      process.exit(1);
    }

    const [host1, host2, path] = [arg1, arg2, arg3];

    // Ensure hosts have protocol
    const normalizeHost = (host: string) => {
      if (!host.startsWith("http://") && !host.startsWith("https://")) {
        return `https://${host}`;
      }
      return host;
    };

    // Ensure path starts with /
    const normalizePath = (path: string) => {
      return path.startsWith("/") ? path : `/${path}`;
    };

    const normalizedHost1 = normalizeHost(host1);
    const normalizedHost2 = normalizeHost(host2);
    const normalizedPath = normalizePath(path);

    url1 = `${normalizedHost1}${normalizedPath}`;
    url2 = `${normalizedHost2}${normalizedPath}`;

    console.log(colorize.info("🔗 Constructed URLs:"));
    console.log(`   ${colorize.dim("URL 1:")} ${url1}`);
    console.log(`   ${colorize.dim("URL 2:")} ${url2}`);
    console.log("");
  } else {
    console.error(colorize.error("Usage: bun run index.ts [options] <args>"));
    console.error("");
    console.error(colorize.bold("Options:"));
    console.error(
      colorize.dim(
        '  --mode <mode>   Diff mode to use: "schema" (default) or "html"'
      )
    );
    console.error("");
    console.error(colorize.bold("Arguments:"));
    console.error(colorize.dim("  2 args: <url1> <url2>"));
    console.error(colorize.dim("  3 args: <host1> <host2> <path>"));
    console.error("");
    console.error(colorize.bold("Examples:"));
    console.error(
      colorize.dim(
        "  bun run index.ts https://example1.com https://example2.com"
      )
    );
    console.error(
      colorize.dim(
        "  bun run index.ts --mode html example1.com example2.com /products/123"
      )
    );
    process.exit(1);
  }

  // Run the selected diff mode
  if (mode === "schema") {
    await runSchemaDiff(url1, url2);
  } else if (mode === "html") {
    await runHtmlDiff(url1, url2);
  } else {
    console.error(
      colorize.error(`Invalid mode "${mode}". Must be "schema" or "html".`)
    );
    process.exit(1);
  }
}

// Run the script
main();
