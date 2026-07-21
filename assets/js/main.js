/* =====================================================================
   Le Pavillon du Sourire — interactions
   ===================================================================== */
(function () {
  "use strict";

  /* ---- Configuration WhatsApp ----
     Numéro au format international sans "+" ni espaces.
     07 70 98 78 38 (Maroc) -> +212 7 70 98 78 38 -> 212770987838   */
  var WHATSAPP_NUMBER = "212770987838";
  var WHATSAPP_MESSAGE = "Bonjour, je souhaite prendre un rendez-vous au Pavillon du Sourire.";

  var waUrl =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(WHATSAPP_MESSAGE);

  // Applique le lien WhatsApp à tous les éléments marqués [data-wa]
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.setAttribute("href", waUrl);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ---- Header : ombre au scroll ---- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Année du footer ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Reveal au scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }
})();
