---
layout: base
title: Accueil
date: 2026-01-31

pagination:
  data: actualite
  size: 6
  alias: actualitePage

---

## Bienvenue sur mon site

     <div class="jumbotron my-3 p-4">
        <div class="container-fluid py-2">
           <img class="rounded float-end img-thumbnail" src="/assets/images/jp.jpg" width="350" height="350" alt="Photo de Jean-Philippe Simonnet">


### Jean-Philippe Simonnet
<p class="col-md-10 fs-5 mb-0 pt-2">Je suis actuellement Chargé de mission 'hospitalité numérique' à la DNUM - Usages Numériques et Innovation - au ministère de l’Aménagement du territoire et de la Décentralisation et le ministère de la Transition écologique, de la Biodiversité, de la Forêt, de la Mer et de la Pêche.</p><p class="col-md-10 fs-5 mb-0 pt-2">Je suis également expert accessibilité depuis 2011.</p>

      <div class="my-3">
      <ul class="list-unstyled reseaux">
            <li><a class="btn btn-outline-secondary mt-2" href="http://www.linkedin.com/in/simonnet/fr"   rel="external"> <img src="/assets/icons/linkedin.svg" alt="Logo Linkedin" class="me-2"> Mon Profil Linkedin</a></li>
      <li><a class="btn btn-outline-secondary mt-2" href="https://www.instagram.com/oxymore93/"   rel="external"> <img src="/assets/icons/instagram.svg" alt="Logo Instagram" class="me-2"> Mon compte Instagram</a></li>
      <li><a class="btn btn-outline-secondary mt-2" href="https://github.com/jpsimonnet"  rel="external"> <img src="/assets/icons/github.svg" alt="Logo Github" class="me-2"> Mon compte Github</a></li>
      <li><a class="btn btn-outline-secondary mt-2" href="http://www.doyoubuzz.com/jean-philippe-simonnet"  rel="external"> <img src="/assets/images/doyoubuzz.svg" alt="Logo doyoubuzz" class="me-2" width="50px"> Mon CV sur Doyoubuzz</a></li>
      </ul>
      </div>
<hr>
<section aria-labelledby="titre-actualite" class="actualite-a-la-une my-5 container">
  <h3 id="titre-actualite" class=" mb-3">À la une </h3>{% if actualitePage and actualitePage.length > 0 %}
    <div class="row">{% for item in actualitePage %}<div class="col-lg-4 col-sm-6 mb-3"><div class="card shadow-sm h-100">{% if item.image %}<img src="{{ item.image }}" alt="Illustration de l’article '{{ item.title }}'" class="card-img-top">{% endif %}<div class="card-body"><h4 class="card-title"><a href="{{ item.url }}" target="_blank" rel="noopener noreferrer" title="{{ item.title }} - (nouvelle fenêtre)" class="stretched-link">{{ item.title }}</a></h4>{% if item.summary %}<p class="card-text">{{ item.summary }}</p>{% endif %}<p class="card-text fw-bold">Publié le {{ item.created | formatDateFr }}</p></div></div></div>{% endfor %}</div>{% else %}<p>Aucune actualité à la une pour le moment.</p>{% endif %}

 <p><a class="btn btn-outline-secondary mt-2" role="button" href="/a-la-une/0/">Toutes les actualité à la une</a></p>
</section>

<hr>

<section aria-labelledby="titre-lectures" class="actualite-a-la-une my-5 container">
  <h3 id="titre-lectures" class=" mb-3">Mes dernieres lectures </h3>

{% set derniers3Livres = collections.livresTries | slice(0, 3) %}{% if derniers3Livres and derniers3Livres.length > 0 %}<div class="row">{% for livre in derniers3Livres %}<div class="col-lg-4 col-sm-6 mb-3"><div class="card shadow-sm h-100">{% if livre.id %}<img src="/assets/images/lectures/{{ livre.id }}.webp" alt="Couverture de {{ livre.Nom }}" class="card-img-top">{% endif %}<div class="card-body"><h4 class="card-title"><a href="/livre/{{ livre.id }}/" title="{{ livre.Nom }}" class="stretched-link">{{ livre.Nom }}</a></h4>{% if livre.Auteur %}<p class="card-text"><strong>{{ livre.Auteur }}</strong></p>{% endif %}{% if livre.Résumé %}<p class="card-text">{{ livre.Résumé | truncate(100) }}</p>{% endif %}<p class="card-text fw-bold">Lu le {{ livre["Lu le"] | formatDateFr }}</p></div></div></div>{% endfor %}</div>{% else %}<p>Aucun livre pour le moment.</p>{% endif %}

 <p><a class="btn btn-outline-secondary mt-2" role="button" href="/lectures/0/">Toutes mes lectures</a></p>
</section>