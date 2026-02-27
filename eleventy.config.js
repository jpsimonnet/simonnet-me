import Image from "@11ty/eleventy-img";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function(eleventyConfig) {

  // Ressources statiques
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/rss/");
  eleventyConfig.addPassthroughCopy({"src/assets/favicon": "/"});
  eleventyConfig.addPassthroughCopy({"src/assets/favicon": "./"});
  eleventyConfig.addPassthroughCopy("src/serment");
  eleventyConfig.addPassthroughCopy("src/rdv");
  eleventyConfig.addPassthroughCopy("src/gobelins");
  eleventyConfig.addPassthroughCopy("src/image-facile");
  eleventyConfig.addPassthroughCopy("src/email-facile");
  eleventyConfig.addPassthroughCopy("src/quizz-facile");
  eleventyConfig.addPassthroughCopy("src/robots.txt");


  
  // Trier les livres par date de lecture (plus récents en premier)
  eleventyConfig.addCollection("livresTries", function() {
    const livresPath = path.join(__dirname, 'src/_data/livres.json');
    const livresData = fs.readFileSync(livresPath, 'utf8');
    const livres = JSON.parse(livresData);
    
    return livres.sort((a, b) => {
      const dateA = new Date(a["Lu le"]);
      const dateB = new Date(b["Lu le"]);
      return dateB - dateA;
    });
  });
  
  
  // Collections
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md").reverse();
  });

  // Collections
  eleventyConfig.addCollection("allPosts", function(collectionApi) {
    // Combine tous les articles avec tous vos tags
    const lectures = collectionApi.getFilteredByTag("lectures");
    const photos = collectionApi.getFilteredByTag("photos");
    const interventions = collectionApi.getFilteredByTag("interventions");
    const actualitePage = collectionApi.getFilteredByTag("actualitePage");
    const post = collectionApi.getFilteredByTag("post");
    
    console.log("📚 Lectures trouvées:", lectures.length);
    console.log("📸 Photos trouvées:", photos.length);
    console.log("🎤 Interventions trouvées:", interventions.length);
    console.log("📰 ActualitePage trouvées:", actualitePage.length);
    console.log("📝 Post trouvés:", post.length);
    
    // Fusionner tous les contenus et trier par date (plus récent en premier)
    const allPosts = [...lectures, ...photos, ...interventions, ...actualitePage, ...post]
      .sort((b, a) => new Date(b.date) - new Date(a.date));
    
    console.log("📄 Total articles pour RSS:", allPosts.length);
    
    return allPosts;
  });

  // Plugins
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/feed.xml",
    collection: {
      name: "allPosts",
      limit: 0, 
    },
    metadata: {
      language: "fr",
      title: "Oxymore",
      subtitle: "Le site de Jean-Philippe Simonnet",
      base: "https://simonnet.me/",
      author: {
        name: "Jean-Philippe Simonnet"
      }
    }
  });

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

  eleventyConfig.addFilter("slice", function(arr, start, end) {
    return arr.slice(start, end);
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
    };
  
    const figureClass = [
      "mb-3",
      "img-fluid",
      position === "right" ? "float-end ms-3" : "",
      position === "left" ? "float-start me-3" : ""
    ].filter(Boolean).join(" ");
  
    const imageHTML = Image.generateHTML(metadata, imageAttributes);
  
    return caption
      ? `<figure class="${figureClass}">${imageHTML}<figcaption class="figure-caption">${caption}</figcaption></figure>`
      : `<figure class="${figureClass}">${imageHTML}</figure>`;
  });
  
  return {
    pathPrefix: "./",
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