---
pagination:
  data: actualite
  size: 9
  alias: actualitePage
permalink: "2025/a-la-une/{{ pagination.pageNumber }}/index.html"
layout: base
title: "À la une"
name : JP Simonnet

---

## Actualités

Ma veille sur l'accessibilité, l'IA, le web : [Le journal de ma veille sur notion](https://oxymore.notion.site/)


<section aria-labelledby="titre-actualite" class="actualite-a-la-une  container p-0">

<div class="container text-center">
  <div class="row align-items-start">
    <div class="col text-start p-0">
      <h3 id="titre-actualite">À la une </h3>
    </div>
    <div class="col">
      <p class="text-end" >Page {{ pagination.pageNumber + 1 }} / {{ pagination.pages.length }}</p>
    </div>
  </div>
</div>
{% if actualitePage and actualitePage.length > 0 %}<div class="row">{% for item in actualitePage %}<div class="col-lg-4 col-sm-6 mb-3"><div class="card shadow-sm h-100">{% if item.image %}<img src="{{ item.image }}" alt="Illustration de l’article '{{ item.title }}'" class="card-img-top">{% endif %}<div class="card-body"><h4 class="card-title"><a href="{{ item.url }}" target="_blank" title="{{ item.title }} - (nouvelle fenêtre)" rel="noopener noreferrer" class="stretched-link">{{ item.title }}</a></h4>{% if item.summary %}<p class="card-text">{{ item.summary }}</p>{% endif %}<p class="card-text fw-bold">Publié le {{ item.created | formatDateFr }}</p></div></div></div>{% endfor %}</div>

    <!-- Pagination nav -->
    <nav aria-label="Pagination des actualités" class="mt-4">
      <ul class="pagination justify-content-center flex-wrap">

        {% if pagination.href.previous %}
          <li class="page-item">
            <a class="page-link" href="{{ pagination.href.previous }}" aria-label="Page précédente">
              &laquo; Précédente
            </a>
          </li>
        {% else %}
          <li class="page-item disabled">
            <span class="page-link" aria-hidden="true">&laquo; Précédente</span>
          </li>
        {% endif %}

        {# Numéros de page #}
        {% for pageNumber in pagination.pages %}
          {% set pageIndex = loop.index0 %}

          {% if pageIndex == pagination.pageNumber %}
            <li class="page-item active" aria-current="page">
              <span class="page-link">{{ pageIndex + 1 }}</span>
            </li>
          {% else %}
            <li class="page-item">
              <a class="page-link" href="{{ pagination.hrefs[pageIndex] }}">
                {{ pageIndex + 1 }}
              </a>
            </li>
          {% endif %}
        {% endfor %}

        {% if pagination.href.next %}
          <li class="page-item">
            <a class="page-link" href="{{ pagination.href.next }}" aria-label="Page suivante">
              Suivante &raquo;
            </a>
          </li>
        {% else %}
          <li class="page-item disabled">
            <span class="page-link" aria-hidden="true">Suivante &raquo;</span>
          </li>
        {% endif %}

      </ul>
    </nav>

  {% else %}
    <p>Aucune actualité à la une pour le moment.</p>
  {% endif %}
</section>