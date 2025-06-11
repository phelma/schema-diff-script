import { type Change, diffLines } from "diff";
import pretty from "pretty";
import { transformHtml } from "./simplify-html";
import { colorize, fetchUrl } from "./utils";

/**
 * Formats and displays the HTML diff results
 */
function displayHtmlDiff(diffs: Change[], url1: string, url2: string) {
  console.log("\n" + colorize.header("HTML DIFF RESULTS"));
  console.log("");

  // URLs section
  console.log(colorize.bold("📍 URLs Compared:"));
  console.log(`   ${colorize.info("URL 1:")} ${colorize.dim(url1)}`);
  console.log(`   ${colorize.info("URL 2:")} ${colorize.dim(url2)}`);
  console.log("");

  console.log(colorize.subheader("HTML Content Differences"));
  console.log(
    colorize.dim(
      "   (showing additions and removals from simplified and formatted HTML)"
    )
  );
  console.log("");

  if (diffs.length === 1 && diffs[0] && !diffs[0].added && !diffs[0].removed) {
    console.log(
      colorize.success("🎉 The simplified HTML content is identical!")
    );
    console.log("");
    return;
  }

  diffs.forEach((part) => {
    let output = "";
    if (part.added) {
      output = part.value
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => colorize.success("+ " + line))
        .join("\n");
    } else if (part.removed) {
      output = part.value
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => colorize.error("- " + line))
        .join("\n");
    } else {
      // To keep context, show a few lines of unchanged text around differences
      const lines = part.value
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (lines.length > 6) {
        output = [
          ...lines.slice(0, 3).map((line) => colorize.dim("  " + line)),
          colorize.dim("  ..."),
          ...lines.slice(-3).map((line) => colorize.dim("  " + line)),
        ].join("\n");
      } else {
        output = lines.map((line) => colorize.dim("  " + line)).join("\n");
      }
    }
    if (output.trim().length > 0) {
      console.log(output);
    }
  });

  console.log("");
}

/**
 * Main execution function for HTML diff mode
 */
export async function runHtmlDiff(url1: string, url2: string) {
  try {
    console.log(colorize.info("🔄 Fetching and simplifying URLs..."));
    console.log("");

    // Fetch both URLs in parallel
    const [html1, html2] = await Promise.all([fetchUrl(url1), fetchUrl(url2)]);

    // Simplify the HTML to remove noise before diffing
    const [simplifiedHtml1, simplifiedHtml2] = await Promise.all([
      transformHtml(html1),
      transformHtml(html2),
    ]);

    // Format the HTML to make the diff cleaner
    const formattedHtml1 = pretty(simplifiedHtml1);
    const formattedHtml2 = pretty(simplifiedHtml2);

    // Create the diff
    const differences = diffLines(formattedHtml1, formattedHtml2, {
      ignoreWhitespace: true,
    });

    // Display results
    displayHtmlDiff(differences, url1, url2);
  } catch (error) {
    console.error(colorize.error("❌ Error:"), error);
    process.exit(1);
  }
}
