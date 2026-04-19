// Default data applied to all pages in src/ (except those with explicit permalink in frontmatter)
// Moves the old site to /2025/*, so the refonte can live at the root.
// Files with an explicit `permalink` in their frontmatter override this.
export default {
  permalink: (data) => `/2025${data.page.filePathStem}/`
};
