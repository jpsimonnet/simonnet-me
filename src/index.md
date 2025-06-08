---
layout: base
title: Accueil
date: 2025-01-01

pagination:
  data: actualite
  size: 3
  alias: actualitePage

---

# Bienvenue sur mon site

     <div class="jumbotron my-3 p-4">
        <div class="container-fluid py-2">
           <img class="rounded float-end img-thumbnail" src="/assets/images/jp.jpg" type="image/svg+xml" width="350" height="350" alt="Bienvenue sur mon site">


       <h2>Jean-Philippe Simonnet</h2>
       <p class="col-md-10 fs-5 mb-0 pt-2">

Je suis actuellement Chargé de mission 'hospitalité numérique' à la DNUM - Usages Numériques et Innovation - au ministère de l’Aménagement du territoire et de la Décentralisation et le ministère de la Transition écologique, de la Biodiversité, de la Forêt, de la Mer et de la Pêche.

</p>
<p class="col-md-10 fs-5 mb-0 pt-2">
Je suis également expert accessibilité depuis 2011.
</p>

      <div class="my-3">
      <ul class="list-unstyled reseaux">
            <li><a class="btn btn-outline-secondary mt-2" href="http://www.linkedin.com/in/simonnet/fr"   rel="external"> <img src="/assets/icons/linkedin.svg" alt="Logo Linkedin" class="me-2"> Mon Profil Linkedin</a></li>
          <li><a class="btn btn-outline-secondary mt-2" href="https://bsky.app/profile/simonnet.me"  rel="external"> <img src="/assets/icons/bluesky.svg" alt="Logo Bluesky" class="me-2" > Mon compte Bluesky</a></li>
      <li><a class="btn btn-outline-secondary mt-2" href="http://www.facebook.com/jeanphilippe.simonnet"  rel="external"> <img src="/assets/icons/facebook.svg" alt="Logo Facebook" class="me-2"> Mon compte facebook</a></li>
            <li><a class="btn btn-outline-secondary mt-2" href="http://www.twitter.com/oxymore"  rel="external"> <img src="/assets/icons/twitter.svg" alt="Logo Twitter" class="me-2" > Mon compte twitter</a></li>
      <li><a class="btn btn-outline-secondary mt-2" href="https://www.instagram.com/oxymore93/"   rel="external"> <img src="/assets/icons/instagram.svg" alt="Logo Instagram" class="me-2"> Mon compte Instagram</a></li>
      <li><a class="btn btn-outline-secondary mt-2" href="https://github.com/jpsimonnet"  rel="external"> <img src="/assets/icons/github.svg" alt="Logo Github" class="me-2"> Mon compte Github</a></li>
      <li><a class="btn btn-outline-secondary mt-2" href="http://www.doyoubuzz.com/jean-philippe-simonnet"  rel="external"> <img src="/assets/images/doyoubuzz.svg" alt="Logo doyoubuzz" class="me-2" width="50px"> Mon CV sur Doyoubuzz</a></li>
      </ul>
      </div>
<hr>
<section aria-labelledby="titre-actualite" class="actualite-a-la-une my-5 container">
  <h2 id="titre-actualite" class=" mb-3">À la une </h2>{% if actualitePage and actualitePage.length > 0 %}
    <div class="row">{% for item in actualitePage %}<div class="col-lg-4 col-sm-6 mb-3"><div class="card shadow-sm h-100">{% if item.image %}<img src="{{ item.image }}" alt="Illustration de l’article '{{ item.title }}'" class="card-img-top">{% endif %}<div class="card-body"><h3 class="card-title"><a href="{{ item.url }}" target="_blank" rel="noopener noreferrer" class="stretched-link">{{ item.title }}</a></h3>{% if item.summary %}<p class="card-text">{{ item.summary }}</p>{% endif %}<p class="card-text fw-bold">Publié le {{ item.created | formatDateFr }}</p></div></div></div>{% endfor %}</div>{% else %}<p>Aucune actualité à la une pour le moment.</p>{% endif %}

 <p><a class="btn btn-outline-secondary mt-2" role="button" href="/a-la-une/0/">Toutes les actualité à la une</a></p>
</section>