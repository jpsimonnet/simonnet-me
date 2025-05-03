export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("./src/style.css");
    eleventyConfig.addPlugin(HtmlBasePlugin);
  };
  import { HtmlBasePlugin } from "@11ty/eleventy";

  export const config = {
    pathPrefix: "/simonnet-me/",
    dir: {
      input: "src",
      output: "public",
      includes: "modeles",
    }

   
  };

