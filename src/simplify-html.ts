import { load } from "cheerio";
import prettier from "prettier";
export async function transformHtml(html: string): Promise<string> {
  // remove comments
  html = html.replace(/<!--([\s\S]*?)-->/g, "");

  // remove double newlines
  html = html.replace(/\n\n+/gm, "\n");

  // remove empty lines
  html = html.replace(/^\s*\n/gm, "");

  const $ = load(html);
  $("[class]").removeAttr("class");
  $("[srcset]").removeAttr("srcset");
  $("[imagesrcset]").removeAttr("imagesrcset");
  $("[style]").removeAttr("style");
  $("[onclick]").removeAttr("onclick");

  // Remove data attributes
  $("*").each((_, el) => {
    const element = $(el);
    const node = element.get(0);
    if (node && "attribs" in node) {
      Object.keys(node.attribs || {}).forEach((attr) => {
        if (attr.startsWith("data-")) {
          element.removeAttr(attr);
        }
      });
    }
  });

  // Remove all <script> tags except those with type="application/ld+json"
  $("script").each((_, el) => {
    if ($(el).attr("type") !== "application/ld+json") {
      $(el).remove();
    }
  });
  // Remove all <style> tags
  $("style").remove();

  // Remove all <link> tags except those with rel="canonical"
  $("link").each((_, el) => {
    if ($(el).attr("rel") !== "canonical") {
      $(el).remove();
    }
  });
  $("template").remove();

  // Remove all child elements of <svg> elements
  $("svg").each((_, el) => {
    if (el.type === "tag") {
      $(el).children().remove();
      // Remove all attributes from <svg> elements
      const attribs = Object.keys(el.attribs || {});
      attribs.forEach((attr) => $(el).removeAttr(attr));
    }
  });

  const formattedHtml = await prettier.format($.html(), { parser: "html" });

  return formattedHtml;
}
