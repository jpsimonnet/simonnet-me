(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var items = document.querySelectorAll("a.galerie-item");
    if (!items.length) return;

    var lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    var img = lightbox.querySelector(".galerie-lightbox-img");
    var counter = lightbox.querySelector(".galerie-lightbox-counter");
    var btnClose = lightbox.querySelector(".galerie-lightbox-close");
    var btnPrev = lightbox.querySelector(".galerie-lightbox-prev");
    var btnNext = lightbox.querySelector(".galerie-lightbox-next");
    var overlay = lightbox.querySelector(".galerie-lightbox-overlay");

    var current = 0;
    var trigger = null;

    function show(index) {
      current = index;
      var item = items[index];
      img.src = item.href;
      img.alt = item.querySelector("img").alt;
      counter.textContent = (index + 1) + " / " + items.length;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }

    function hide() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      img.src = "";
      if (trigger) {
        trigger.focus();
        trigger = null;
      }
    }

    function prev() {
      show(current > 0 ? current - 1 : items.length - 1);
    }

    function next() {
      show(current < items.length - 1 ? current + 1 : 0);
    }

    items.forEach(function (item, i) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        trigger = item;
        show(i);
      });
    });

    btnClose.addEventListener("click", hide);
    overlay.addEventListener("click", hide);
    btnPrev.addEventListener("click", prev);
    btnNext.addEventListener("click", next);

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") hide();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    });

    // Focus trap
    lightbox.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusable = [btnClose, btnPrev, btnNext];
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  });
})();
