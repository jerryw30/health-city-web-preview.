
(function () {
  "use strict";
  document.querySelectorAll(".v3-faq-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".v3-faq-item");
      var answer = item.querySelector(".v3-faq-answer");
      var symbol = item.querySelector(".v3-faq-symbol");
      var open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", open ? "false" : "true");
      answer.setAttribute("aria-hidden", open ? "true" : "false");
      item.classList.toggle("is-open", !open);
      symbol.textContent = open ? "+" : "−";
    });
  });
})();
