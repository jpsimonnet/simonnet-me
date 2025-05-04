import Image from "@11ty/eleventy-img";
import path from "path";
import { HtmlBasePlugin } from "@11ty/eleventy";

export default function(eleventyConfig) {


  // Ressources statiques
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/rss/");

  // Plugins
  eleventyConfig.addPlugin(HtmlBasePlugin);
  

  // Shortcodes
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Filtres
  eleventyConfig.addFilter("formatDateFr", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  });

  eleventyConfig.addNunjucksAsyncShortcode("imageResponsive", async function(
    src,
    alt = "",
    position = "",
    widths = [600],
    formats = ["webp", "jpeg"],
    caption = ""
  ) {
    const metadata = await Image(src, {
      widths,
      formats,
      outputDir: "./public/img/",
      urlPath: "/img/",
      data: "_data",
    });
  
    const imageAttributes = {
      alt,
      loading: "lazy",
      decoding: "async"
      // ❌ PAS de class ici → pas de classe sur <img>
    };
  
    // ✅ Classes Bootstrap uniquement sur <figure>
    const figureClass = [
      "mb-3",
      "img-fluid", // tu peux l'enlever si non souhaité
      position === "right" ? "float-end ms-3" : "",
      position === "left" ? "float-start me-3" : ""
    ].filter(Boolean).join(" ");
  
    const imageHTML = Image.generateHTML(metadata, imageAttributes);
  
    return caption
      ? `<figure class="${figureClass}">${imageHTML}<figcaption class="figure-caption">${caption}</figcaption></figure>`
      : `<figure class="${figureClass}">${imageHTML}</figure>`;
  });
  

  // ✅ Retourne TOUT ici (y compris markdownTemplateEngine)
  return {
    pathPrefix: "/simonnet-me/",
    dir: {
      input: "src",
      output: "public",
      layouts: "modeles",
      includes: "fragments"
    },
    markdownTemplateEngine: "njk",   
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk"]
  };
}
