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

### Sample Output

```
=== Schema Diff Results ===

URL 1: https://example1.com
URL 2: https://example2.com
Schemas found in URL 1: 2
Schemas found in URL 2: 2

❌ Found 3 difference(s):

1. Changed at 0.name: "Old Name" → "New Name"
2. Added at 0.description: "New description"
3. Removed from 1.author: {"name":"John Doe"}
```

## How It Works

1. **Fetching**: Both URLs are fetched in parallel using the Fetch API
2. **Parsing**: HTML is parsed using Cheerio to extract JSON-LD script tags
3. **Normalization**: Schemas are normalized by recursively sorting arrays and object keys to ensure order doesn't affect comparison
4. **Diffing**: Uses the `deep-diff` library to find all differences between normalized schemas
5. **Formatting**: Differences are formatted into human-readable descriptions

## Error Handling

- Invalid URLs or network errors are caught and reported
- Malformed JSON-LD schemas are skipped with warnings
- Missing arguments show usage instructions

## Dependencies

- `cheerio`: HTML parsing and jQuery-like DOM manipulation
- `deep-diff`: Deep object comparison and diffing
- `@types/cheerio` & `@types/deep-diff`: TypeScript type definitions
