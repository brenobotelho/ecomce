(() => {
  "use strict";

  // WhatsApp: informe DDI, DDD e número, somente dígitos. O formulário
  // usa o e-mail do HTML até que um endpoint HTTPS de envio seja configurado.
  const contactSettings = {
    whatsapp: "",
    formEndpoint: "",
  };

  function setupHeader() {
    const header = document.querySelector(".site-header");
    const bar = header.querySelector(".header-bar");
    const toggle = header.querySelector(".menu-toggle");
    const toggleLabel = toggle.querySelector(".sr-only");
    const nav = header.querySelector(".site-nav");
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = [...document.querySelectorAll("main > section[id]")];
    const darkSurfaces = [...document.querySelectorAll('[data-theme="dark"]')];
    const mobile = matchMedia("(max-width: 940px)");
    let scheduled = false;

    function setMenu(open, restoreFocus = false) {
      nav.hidden = mobile.matches && !open;
      toggle.setAttribute("aria-expanded", String(mobile.matches && open));
      toggleLabel.textContent = open ? "Fechar menu" : "Abrir menu";
      if (restoreFocus) toggle.focus();
    }

    function syncLayout() {
      const focusWasInNav = nav.contains(document.activeElement);
      const focusWasOnToggle = document.activeElement === toggle;
      toggle.hidden = !mobile.matches;
      setMenu(false, mobile.matches && focusWasInNav);
      if (!mobile.matches && focusWasOnToggle) links[0].focus();
    }

    function updateHeader() {
      scheduled = false;
      const barRect = bar.getBoundingClientRect();
      const sampleY = barRect.top + barRect.height / 2;
      const dark = darkSurfaces.some((surface) => {
        const rect = surface.getBoundingClientRect();
        return rect.top <= sampleY && rect.bottom > sampleY;
      });
      const theme = dark ? "dark" : "light";
      if (header.dataset.theme !== theme) header.dataset.theme = theme;

      const current = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        const marker = barRect.bottom + 24;
        return rect.top <= marker && rect.bottom > marker;
      });
      links.forEach((link) => {
        if (current && link.hash === "#" + current.id) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function scheduleUpdate() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateHeader);
    }

    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link || !mobile.matches) return;
      setMenu(false);
      const section = link.getAttribute("href").startsWith("#")
        ? document.getElementById(link.hash.slice(1))
        : null;
      if (section) {
        section.tabIndex = -1;
        section.focus({ preventScroll: true });
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setMenu(false, true);
      }
    });
    document.addEventListener("click", (event) => {
      if (mobile.matches && !nav.hidden && !header.contains(event.target)) setMenu(false);
    });
    document.addEventListener("focusin", (event) => {
      if (mobile.matches && !nav.hidden && !header.contains(event.target)) setMenu(false);
    });

    document.documentElement.classList.add("has-fixed-header");
    syncLayout();
    updateHeader();
    mobile.addEventListener("change", syncLayout);
    addEventListener("scroll", scheduleUpdate, { passive: true });
    addEventListener("resize", scheduleUpdate, { passive: true });
    addEventListener("pageshow", scheduleUpdate);
    addEventListener("load", scheduleUpdate, { once: true });
    document.fonts?.ready.then(scheduleUpdate);
  }

  function setupReveals() {
    if (!("IntersectionObserver" in window)) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.revealState = "shown";
        observer.unobserve(entry.target);
      }
    });

    document.querySelectorAll("[data-reveal]").forEach((element) => {
      if (element.getBoundingClientRect().top < innerHeight) return;
      element.dataset.revealState = "pending";
      observer.observe(element);
    });

    motion.addEventListener("change", () => {
      if (!motion.matches) return;
      observer.disconnect();
      document.querySelectorAll('[data-reveal-state="pending"]').forEach((element) => {
        delete element.dataset.revealState;
      });
    });
  }

  function setupContact() {
    const form = document.querySelector("#contact-form");
    if (!form) return;
    const emailLink = document.querySelector("[data-contact-email]");
    const whatsapp = document.querySelector("#whatsapp-link");
    const submit = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".form-status");
    const email = emailLink.getAttribute("href");
    const { formEndpoint, whatsapp: phone } = contactSettings;

    if (phone) {
      whatsapp.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent("Olá, é.com cê! Gostaria de conversar sobre um projeto.");
      whatsapp.hidden = false;
    }
    if (formEndpoint) {
      submit.textContent = "Enviar mensagem";
      form.querySelector(".form-note").hidden = true;
    }

    function showStatus(message, error = false) {
      status.textContent = message;
      status.dataset.error = String(error);
    }

    form.addEventListener("input", (event) => {
      event.target.setCustomValidity?.("");
      if (status.textContent) showStatus("");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fields = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));

      for (const key of ["nome", "msg"]) {
        if (fields[key]) continue;
        const field = form.elements.namedItem(key);
        field.setCustomValidity("Preencha este campo.");
        field.reportValidity();
        return;
      }

      if (!formEndpoint) {
        const subject = encodeURIComponent("Novo projeto — é.com cê");
        const body = encodeURIComponent([
          "Nome: " + fields.nome,
          "E-mail: " + fields.email,
          fields.empresa && "Marca ou empresa: " + fields.empresa,
          fields.servico && "Serviço: " + fields.servico,
          "\n" + fields.msg,
        ].filter(Boolean).join("\r\n"));

        showStatus("Se o aplicativo não abrir, escreva para " + email.slice("mailto:".length) + ".");
        location.href = email + "?subject=" + subject + "&body=" + body;
        return;
      }

      submit.disabled = true;
      showStatus("Enviando mensagem…");
      try {
        const response = await fetch(formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(fields),
        });
        if (!response.ok) throw new Error("Falha no envio.");
        form.reset();
        showStatus("Mensagem enviada! Vamos responder em breve.");
      } catch {
        showStatus("Não foi possível enviar agora. Tente de novo ou use o link de e-mail.", true);
      } finally {
        submit.disabled = false;
      }
    });

    form.hidden = false;
  }

  function setupProjectFilters() {
    const filters = document.querySelector(".project-filters");
    if (!filters) return;
    const projects = [...document.querySelectorAll("[data-project-category]")];
    const buttons = [...filters.querySelectorAll("button")];
    const status = document.querySelector("#project-filter-status");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.dataset.filter;
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        let count = 0;
        projects.forEach((project) => {
          const visible = category === "todos" || project.dataset.projectCategory === category;
          project.hidden = !visible;
          if (visible) count++;
        });
        status.textContent = count === 1 ? "1 projeto exibido." : count + " projetos exibidos.";
      });
    });
    filters.hidden = false;
  }

// Servidores estáticos abrem index.html automaticamente em cada pasta.
  if (location.protocol === "file:") {
    document.querySelectorAll('a[href^="./"], a[href^="../"]').forEach((link) => {
      const url = new URL(link.href);
      if (!url.pathname.endsWith("/")) return;
      url.pathname += "index.html";
      link.href = url.href;
    });
  }

  document.querySelector("#current-year").textContent = new Date().getFullYear();
  setupHeader();
  setupContact();
  setupProjectFilters();
  setupReveals();
})();
