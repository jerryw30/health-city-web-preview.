
(function () {
  "use strict";
  document.querySelectorAll(".refined-faq-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".refined-faq-item");
      var answer = item.querySelector(".refined-faq-answer");
      var symbol = item.querySelector(".refined-faq-symbol");
      var open = button.getAttribute("aria-expanded") === "true";

      button.setAttribute("aria-expanded", open ? "false" : "true");
      answer.setAttribute("aria-hidden", open ? "true" : "false");
      item.classList.toggle("is-open", !open);
      symbol.textContent = open ? "+" : "−";
    });
  });
})();
