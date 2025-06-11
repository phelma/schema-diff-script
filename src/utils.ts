import chalk from "chalk";

/**
 * Helper functions for colored output using chalk
 */
export const colorize = {
  success: (text: string) => chalk.green(text),
  error: (text: string) => chalk.red(text),
  warning: (text: string) => chalk.yellow(text),
  info: (text: string) => chalk.blue(text),
  highlight: (text: string) => chalk.cyan(text),
  bold: (text: string) => chalk.bold(text),
  dim: (text: string) => chalk.dim(text),
  magenta: (text: string) => chalk.magenta(text),
  header: (text: string) => chalk.bgBlue.white.bold(` ${text} `),
  subheader: (text: string) => chalk.bgCyan.white(` ${text} `),
};

/**
 * Fetches HTML content from a URL
 */
export async function fetchUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error}`);
  }
}
