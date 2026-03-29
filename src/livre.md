---
pagination:
  data: livres
  size: 1
  alias: livre
permalink: "livre/{{ livre.id }}/index.html"
layout: lectures
eleventyComputed:
  title: "{{ livre.Nom }}"
eleventyNavigation:
  key: lectures
  hideInMainNav: true
---