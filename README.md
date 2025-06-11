# Schema & HTML Diff Script

A powerful command-line tool for comparing web pages. It can perform a detailed diff on either the JSON-LD schemas or the raw HTML content of two URLs.

## Features

- **Dual Diff Modes**:
  - **Schema Mode**: Intelligently diffs JSON-LD schemas, ignoring order and focusing on content changes.
  - **HTML Mode**: Diffs the simplified and formatted HTML structure of two pages.
- **Flexible URL Input**: Compare full URLs or provide two hosts and a common path.
- **HTML Simplification**: Automatically removes noise (classes, styles, scripts, comments) from HTML before diffing for more meaningful comparisons.
- **Rich Console Output**: Beautiful, color-coded output makes it easy to spot differences at a glance.
- **Robust**: Handles malformed JSON, network errors, and different schema structures gracefully.

## Installation

Make sure you have [Bun](https://bun.sh) installed, then install dependencies:

```bash
bun install
```

## Usage

The script can be run with either 2 or 3 arguments, and an optional `--mode` flag.

```bash
bun run index.ts [options] <args>
```

### Options

- `--mode <mode>`: Sets the diffing mode.
  - `schema` (default): Performs a diff on JSON-LD schemas.
  - `html`: Performs a diff on the simplified HTML content.

### Arguments

1.  **2-Argument Format**: `<url1> <url2>`
    - Compares two full URLs directly.

2.  **3-Argument Format**: `<host1> <host2> <path>`
    - Constructs two URLs to compare the same path on different hosts (e.g., staging vs. production).

### Examples

**Schema Diff (Default Mode)**

```bash
# Compare schemas on two different pages
bun run index.ts https://example.com/page1 https://example.com/page2

# Compare schemas for the same page on different hosts
bun run index.ts staging.example.com prod.example.com /product/123
```

**HTML Diff**

```bash
# Compare the simplified HTML of two pages
bun run index.ts --mode html https://site.com/a https://site.com/b

# Compare HTML on staging vs. production
bun run index.ts --mode html staging.site.com prod.site.com /
```

## Diff Modes Explained

### Schema Mode (`--mode schema`)

This is the default mode. It's designed to find meaningful differences in the structured data of a page.

- **Extracts**: Finds all `script[type="application/ld+json"]` tags.
- **Groups**: Organizes schemas by their `@type` (e.g., `Product`, `Organization`).
- **Normalizes**: Sorts keys and array elements to ignore order-only changes.
- **Compares**: Diffs schemas of the same type against each other.
- **Reports**: Shows a summary of added/removed schema types and a detailed breakdown of content changes with color-coded, formatted JSON.

### HTML Mode (`--mode html`)

This mode is for comparing the core HTML structure of two pages, ignoring superficial differences.

- **Simplifies**: Before comparing, it heavily processes the HTML to remove noise:
  - Comments, scripts (except JSON-LD), and style tags.
  - `class`, `style`, `srcset`, and `data-*` attributes.
  - All contents of `<svg>` tags.
- **Formats**: The simplified HTML is then pretty-printed for a consistent structure.
- **Compares**: A line-by-line diff of the cleaned HTML is performed.
- **Reports**: Shows a color-coded diff with additions and removals, with surrounding context for clarity.

## Dependencies

- **`cheerio`**: HTML parsing and traversal.
- **`chalk`**: Terminal string styling.
- **`deep-diff`**: Deep object comparison for schemas.
- **`diff`**: Text diffing for HTML.
- **`minimist`**: Command-line argument parsing.
- **`pretty` & `prettier`**: HTML formatting and cleaning.
