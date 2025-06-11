import chalk from "chalk";
import * as cheerio from "cheerio";
import { diff } from "deep-diff";
import { colorize, fetchUrl } from "./utils";

interface JsonLdSchema {
  url: string;
  schemas: any[];
  schemasByType: Map<string, any[]>;
}

/**
 * Formats JSON with proper indentation and color
 */
function formatJson(obj: any, indent: number = 2): string {
  const jsonString = JSON.stringify(obj, null, indent);

  // Add syntax highlighting to JSON
  return jsonString
    .replace(/"([^"]+)":/g, (match, key) => `${chalk.blue(`"${key}"`)}:`) // Keys in blue
    .replace(/: "([^"]+)"/g, (match, value) => `: ${chalk.green(`"${value}"`)}`) // String values in green
    .replace(/: (\d+)/g, (match, value) => `: ${chalk.yellow(value)}`) // Numbers in yellow
    .replace(/: (true|false)/g, (match, value) => `: ${chalk.magenta(value)}`) // Booleans in magenta
    .replace(/: null/g, `: ${chalk.dim("null")}`); // null in dim
}

/**
 * Formats a value for display with proper JSON formatting if it's an object
 */
function formatValue(value: any): string {
  if (typeof value === "string") {
    return colorize.highlight(`"${value}"`);
  } else if (typeof value === "number") {
    return chalk.yellow(value.toString());
  } else if (typeof value === "boolean") {
    return chalk.magenta(value.toString());
  } else if (value === null) {
    return chalk.dim("null");
  } else if (typeof value === "object") {
    // For objects and arrays, format as JSON with indentation
    const formatted = formatJson(value, 2);
    // Indent each line for proper nesting in the diff output
    return (
      "\n" +
      formatted
        .split("\n")
        .map((line) => "     " + line)
        .join("\n")
    );
  } else {
    return chalk.cyan(String(value));
  }
}

/**
 * Gets the schema type(s) from a JSON-LD object
 */
function getSchemaType(schema: any): string {
  if (!schema) return "unknown";

  // Handle @type as string
  if (typeof schema["@type"] === "string") {
    return schema["@type"];
  }

  // Handle @type as array
  if (Array.isArray(schema["@type"])) {
    return schema["@type"].sort().join(", ");
  }

  // Handle nested objects with @type
  if (schema["@type"] && typeof schema["@type"] === "object") {
    return JSON.stringify(schema["@type"]);
  }

  // Fallback to 'unknown' if no @type found
  return "unknown";
}

/**
 * Groups schemas by their @type
 */
function groupSchemasByType(schemas: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>();

  schemas.forEach((schema) => {
    const type = getSchemaType(schema);
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(schema);
  });

  return grouped;
}

/**
 * Extracts all JSON-LD schemas from HTML content and groups them by type
 */
function extractJsonLdSchemas(html: string, url: string): JsonLdSchema {
  const $ = cheerio.load(html);
  const schemas: any[] = [];

  $('script[type="application/ld+json"]').each(
    (_index: number, element: cheerio.Element) => {
      try {
        const content = $(element).html();
        if (content) {
          const parsed = JSON.parse(content);
          // Handle both single schemas and arrays of schemas
          if (Array.isArray(parsed)) {
            schemas.push(...parsed);
          } else {
            schemas.push(parsed);
          }
        }
      } catch (error) {
        console.warn(
          colorize.warning(
            `Warning: Failed to parse JSON-LD schema in ${url}:`
          ),
          error
        );
      }
    }
  );

  const schemasByType = groupSchemasByType(schemas);

  return { url, schemas, schemasByType };
}

/**
 * Normalizes a single schema for comparison by sorting arrays and objects
 */
function normalizeSchema(schema: any): any {
  if (Array.isArray(schema)) {
    return schema
      .map(normalizeSchema)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  if (schema && typeof schema === "object") {
    const normalized: any = {};
    const sortedKeys = Object.keys(schema).sort();

    for (const key of sortedKeys) {
      normalized[key] = normalizeSchema(schema[key]);
    }

    return normalized;
  }

  return schema;
}

/**
 * Compares schemas of the same type
 */
function compareSchemasOfType(type: string, schemas1: any[], schemas2: any[]) {
  const normalized1 = schemas1
    .map(normalizeSchema)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const normalized2 = schemas2
    .map(normalizeSchema)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  const differences = diff(normalized1, normalized2);

  return {
    type,
    count1: schemas1.length,
    count2: schemas2.length,
    differences: differences || [],
    identical: !differences || differences.length === 0,
  };
}

/**
 * Compares two sets of schemas grouped by type
 */
function compareSchemas(schemas1: JsonLdSchema, schemas2: JsonLdSchema) {
  const allTypes = new Set([
    ...schemas1.schemasByType.keys(),
    ...schemas2.schemasByType.keys(),
  ]);

  const typeComparisons: any[] = [];
  const typeCounts1: Record<string, number> = {};
  const typeCounts2: Record<string, number> = {};

  // Build type counts
  schemas1.schemasByType.forEach((schemas, type) => {
    typeCounts1[type] = schemas.length;
  });
  schemas2.schemasByType.forEach((schemas, type) => {
    typeCounts2[type] = schemas.length;
  });

  // Compare each type
  allTypes.forEach((type) => {
    const schemas1OfType = schemas1.schemasByType.get(type) || [];
    const schemas2OfType = schemas2.schemasByType.get(type) || [];

    const comparison = compareSchemasOfType(
      type,
      schemas1OfType,
      schemas2OfType
    );
    typeComparisons.push(comparison);
  });

  return {
    url1: schemas1.url,
    url2: schemas2.url,
    totalSchemas1: schemas1.schemas.length,
    totalSchemas2: schemas2.schemas.length,
    typeCounts1,
    typeCounts2,
    typeComparisons,
    allTypesIdentical: typeComparisons.every((comp) => comp.identical),
  };
}

/**
 * Formats and displays the diff results
 */
function displayResults(comparison: any) {
  console.log("\n" + colorize.header("SCHEMA DIFF RESULTS"));
  console.log("");

  // URLs section
  console.log(colorize.bold("📍 URLs Compared:"));
  console.log(`   ${colorize.info("URL 1:")} ${colorize.dim(comparison.url1)}`);
  console.log(`   ${colorize.info("URL 2:")} ${colorize.dim(comparison.url2)}`);
  console.log("");

  // Total counts section
  console.log(colorize.bold("📊 Total Schema Counts:"));
  const totalChange = comparison.totalSchemas2 - comparison.totalSchemas1;
  const totalChangeText =
    totalChange === 0
      ? colorize.success("(no change)")
      : totalChange > 0
      ? colorize.warning(`(+${totalChange})`)
      : colorize.error(`(${totalChange})`);
  console.log(
    `   ${comparison.totalSchemas1} → ${comparison.totalSchemas2} ${totalChangeText}`
  );
  console.log("");

  // Schema types summary
  console.log(colorize.subheader("Schema Types Summary"));
  console.log("");

  const allTypes = new Set([
    ...Object.keys(comparison.typeCounts1),
    ...Object.keys(comparison.typeCounts2),
  ]);

  if (allTypes.size === 0) {
    console.log(colorize.warning("   No schemas found on either page"));
    return;
  }

  allTypes.forEach((type) => {
    const count1 = comparison.typeCounts1[type] || 0;
    const count2 = comparison.typeCounts2[type] || 0;
    const isIdentical = count1 === count2;

    let status: string;
    let countDisplay: string;

    if (count1 === 0) {
      status = colorize.success("✨ NEW");
      countDisplay = colorize.success(`0 → ${count2}`);
    } else if (count2 === 0) {
      status = colorize.error("🗑️  REMOVED");
      countDisplay = colorize.error(`${count1} → 0`);
    } else if (isIdentical) {
      status = colorize.success("✅ SAME");
      countDisplay = colorize.dim(`${count1}`);
    } else {
      status = colorize.warning("📝 CHANGED");
      countDisplay = colorize.warning(`${count1} → ${count2}`);
    }

    console.log(`   ${status} ${colorize.highlight(type)}: ${countDisplay}`);
  });

  console.log("");

  if (comparison.allTypesIdentical) {
    console.log(colorize.success("🎉 All schema types are identical!"));
    console.log("");
    return;
  }

  // Detailed differences section
  console.log(colorize.subheader("Detailed Differences by Type"));
  console.log("");

  const changedTypes = comparison.typeComparisons.filter(
    (typeComp: any) => !typeComp.identical
  );

  if (changedTypes.length === 0) {
    console.log(
      colorize.success("   No content differences found (only count changes)")
    );
    console.log("");
    return;
  }

  changedTypes.forEach((typeComp: any, typeIndex: number) => {
    console.log(colorize.bold(`🔍 ${typeComp.type}`));
    console.log(
      `   ${colorize.dim("Count:")} ${typeComp.count1} → ${typeComp.count2}`
    );
    console.log(
      `   ${colorize.dim("Changes:")} ${colorize.warning(
        typeComp.differences.length.toString()
      )}`
    );
    console.log("");

    typeComp.differences.forEach((diff: any, index: number) => {
      const diffText = formatDifference(diff);
      console.log(`   ${colorize.dim(`${index + 1}.`)} ${diffText}`);
    });

    // Add spacing between types, but not after the last one
    if (typeIndex < changedTypes.length - 1) {
      console.log("");
      console.log(colorize.dim("   " + "─".repeat(60)));
      console.log("");
    }
  });

  console.log("");
}

/**
 * Formats a single difference for display
 */
function formatDifference(difference: any): string {
  const path = difference.path ? difference.path.join(".") : "root";
  const pathDisplay = colorize.magenta(path);

  switch (difference.kind) {
    case "N": // New
      return `${colorize.success("Added")} at ${pathDisplay}: ${formatValue(
        difference.rhs
      )}`;
    case "D": // Deleted
      return `${colorize.error("Removed")} from ${pathDisplay}: ${colorize.dim(
        formatValue(difference.lhs)
      )}`;
    case "E": // Edited
      return `${colorize.warning("Changed")} at ${pathDisplay}: ${colorize.dim(
        formatValue(difference.lhs)
      )} → ${formatValue(difference.rhs)}`;
    case "A": // Array change
      return `${colorize.info("Array change")} at ${pathDisplay}[${
        difference.index
      }]: ${formatArrayChange(difference)}`;
    default:
      return `${colorize.warning(
        "Unknown change"
      )} at ${pathDisplay}: ${formatValue(difference)}`;
  }
}

/**
 * Formats array-specific changes
 */
function formatArrayChange(difference: any): string {
  if (difference.item.kind === "N") {
    return `${colorize.success("Added")} ${formatValue(difference.item.rhs)}`;
  } else if (difference.item.kind === "D") {
    return `${colorize.error("Removed")} ${colorize.dim(
      formatValue(difference.item.lhs)
    )}`;
  } else {
    return `${colorize.warning("Modified")} ${formatValue(difference.item)}`;
  }
}

/**
 * Main execution function for schema diff mode
 */
export async function runSchemaDiff(url1: string, url2: string) {
  try {
    console.log(colorize.info("🔄 Fetching URLs and extracting schemas..."));
    console.log("");

    // Fetch both URLs in parallel
    const [html1, html2] = await Promise.all([fetchUrl(url1), fetchUrl(url2)]);

    // Extract schemas from both pages
    const schemas1 = extractJsonLdSchemas(html1, url1);
    const schemas2 = extractJsonLdSchemas(html2, url2);

    // Compare the schemas
    const comparison = compareSchemas(schemas1, schemas2);

    // Display results
    displayResults(comparison);
  } catch (error) {
    console.error(colorize.error("❌ Error:"), error);
    process.exit(1);
  }
}
