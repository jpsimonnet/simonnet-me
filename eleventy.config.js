export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("./src/style.css");
  };

  export const config = {
    
    dir: {
      input: "src",
      output: "public",
      includes: "modeles"
    }
  };