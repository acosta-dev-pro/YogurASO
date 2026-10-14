/* faq.js — Aquí queda el acordeón de preguntas frecuentes. */
(function () {
    "use strict";

    var root = document.getElementById("preguntas");
    var list = root && root.querySelector("[data-faq]");
    if (!root || !list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll(".faq-item"));
    var triggers = items.map(function (item) {
        return item.querySelector(".faq-trigger");
    }).filter(Boolean);

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setOpen(item, open) {
        var btn = item.querySelector(".faq-trigger");
        var id = btn && btn.getAttribute("aria-controls");
        var panel = id ? document.getElementById(id) : null;
        if (!btn || !panel) return;
        item.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        panel.setAttribute("aria-hidden", open ? "false" : "true");
    }

    items.forEach(function (item) {
        setOpen(item, false);
        var btn = item.querySelector(".faq-trigger");
        if (!btn) return;
        btn.addEventListener("click", function () {
            var willOpen = btn.getAttribute("aria-expanded") !== "true";
            items.forEach(function (other) {
                if (other !== item) setOpen(other, false);
            });
            setOpen(item, willOpen);
        });
    });

    list.addEventListener("keydown", function (event) {
        var index = triggers.indexOf(document.activeElement);
        if (index === -1) return;
        var next = null;
        if (event.key === "ArrowDown") next = triggers[(index + 1) % triggers.length];
        else if (event.key === "ArrowUp") next = triggers[(index - 1 + triggers.length) % triggers.length];
        else if (event.key === "Home") next = triggers[0];
        else if (event.key === "End") next = triggers[triggers.length - 1];
        else return;
        event.preventDefault();
        next.focus();
    });

    root.classList.add("is-js");
    if (reduceMotion || !("IntersectionObserver" in window)) {
        root.classList.add("is-in");
        return;
    }
    new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            root.classList.add("is-in");
            obs.disconnect();
        });
    }, { threshold: 0.16 }).observe(root);
})();
