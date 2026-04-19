---
pagination:
  data: collections.livresTries
  size: 20
  alias: livresPage
permalink: "2025/lectures/{{ pagination.pageNumber }}/index.html"
layout: base
title: "Mes dernières lectures"
name : JP Simonnet
---

## Mes dernières lectures


<section aria-labelledby="titre-livres" class="livres container p-0">

  <div class="container text-center">
    <div class="row align-items-start">
      <div class="col">
        <p class="text-end">Page {{ pagination.pageNumber + 1 }} / {{ pagination.pages.length }}</p>
      </div>
    </div>
  </div>

  {% if livresPage and livresPage.length > 0 %}
    <div class="row">
      {% for livre in livresPage %}
        <div class="col-lg-3 col-sm-6 mb-3">
          <div class="card shadow-sm h-100">{% if livre.id %}<img src="/assets/images/lectures/{{ livre.id }}.webp" alt="Couverture du livre '{{ livre.Nom }}'" class="card-img-top">{% endif %}
            <div class="card-body"><h4 class="card-title"><a href="/2025/livre/{{ livre.id }}/" title="{{ livre.Nom }}" class="stretched-link">{{ livre.Nom }}</a></h4>{% if livre.Auteur %}<p class="card-text"><strong>{{ livre.Auteur }}</strong></p>{% endif %}{% if livre["Lu le"] %}<p class="card-text">Lu le {{ livre["Lu le"] | formatDateFr }}</p>{% endif %}</div></div></div>{% endfor %}</div>

    <!-- Pagination nav -->
    <nav aria-label="Pagination des livres" class="mt-4">
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
    <p>Aucun livre pour le moment.</p>
  {% endif %}
</section>