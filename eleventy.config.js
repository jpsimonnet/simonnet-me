export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("./src/style.css");
    eleventyConfig.addPlugin(HtmlBasePlugin);
  };
  import { HtmlBasePlugin } from "@11ty/eleventy";

  export const config = {
    pathPrefix: "./",
    dir: {
      input: "src",
      output: "public",
      includes: "modeles",
    }

   
  };

