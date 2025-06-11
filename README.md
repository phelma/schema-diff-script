# Schema Diff Script

A TypeScript/Bun script that compares JSON-LD schemas between two web pages and outputs a detailed diff.

## Features

- Fetches HTML content from two URLs
- Extracts all JSON-LD schemas (`script[type="application/ld+json"]`) from both pages
- Normalizes schemas to ignore order differences (arrays and object keys are sorted)
- Provides detailed diff output showing additions, deletions, and modifications
- Handles malformed JSON gracefully with warnings

## Installation

Make sure you have [Bun](https://bun.sh) installed, then install dependencies:

```bash
bun install
```

## Usage

```bash
bun run index.ts <url1> <url2>
```

### Example

```bash
bun run index.ts https://example1.com https://example2.com
```

## Output

The script will display:
- Number of schemas found on each page
- Whether the schemas are identical
- If different, a detailed list of all differences including:
  - Added properties
  - Removed properties
  - Modified values
  - Array changes
