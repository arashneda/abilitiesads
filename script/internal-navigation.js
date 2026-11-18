(() => {
  "use strict";

  const toggle = document.getElementById("internalNavToggle");
  const panel = document.getElementById("internalNavPanel");
  const overlay = document.getElementById("internalNavOverlay");
  const backToTop = document.getElementById("internalNavBackToTop");

  if (!toggle || !panel || !overlay || !backToTop) return;

  const body = document.body;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const servicesGroup = panel.querySelector('[data-submenu-group="services"]');
  const servicesToggle = servicesGroup?.querySelector(".internal-nav-submenu-toggle");
  const servicesSubmenu = servicesGroup?.querySelector(".internal-nav-submenu");

  let isOpen = false;
  let savedScrollY = 0;
  let previousBodyStyles = null;
  let scrollUpdateScheduled = false;

  function normalizedPath() {
    const path = decodeURIComponent(window.location.pathname);
    return path.endsWith("/") ? path + "index.html" : path;
  }

  function setCurrentPage() {
    const path = normalizedPath();
    const file = path.split("/").pop().toLowerCase();
    const serviceFiles = ["photography.html", "graphic-design.html", "web-design.html", "addvideoai.html"];
    const articleFiles = [
      "article-visual-attention.html",
      "article-mental-imagery.html",
      "article-ai-product-photography.html"
    ];

    panel.querySelectorAll("[data-nav-link]").forEach((link) => {
      const href = link.getAttribute("href");
      const target = href.split("/").pop().toLowerCase();
      const isExactPage = target === file;
      const isArticleDetail = link.dataset.navSection === "articles" && articleFiles.includes(file);
      const isServiceSection = link.dataset.navSection === "services" &&
        (file === "services.html" || serviceFiles.includes(file));

      const isCurrent = isExactPage || isArticleDetail || isServiceSection;
      const row = link.closest(".internal-nav-row");
      row?.classList.toggle("is-current", isCurrent);

      if (isExactPage) {
        link.setAttribute("aria-current", "page");
      } else if (isArticleDetail || isServiceSection) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const currentServiceChild = serviceFiles.includes(file);
    if (currentServiceChild && servicesToggle && servicesSubmenu) {
      setSubmenuOpen(true);
    }
  }

  function setSubmenuOpen(open) {
    if (!servicesToggle || !servicesSubmenu) return;

    servicesToggle.setAttribute("aria-expanded", String(open));
    servicesSubmenu.classList.toggle("is-open", open);
    servicesSubmenu.setAttribute("aria-hidden", String(!open));
    servicesSubmenu.inert = !open;
  }

  function getFocusableElements() {
    const panelElements = Array.from(panel.querySelectorAll(focusableSelector))
      .filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
    return [toggle, ...panelElements];
  }

  function lockPageScroll() {
    savedScrollY = window.scrollY;
    previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      rootOverflow: root.style.overflow
    };

    root.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
  }

  function unlockPageScroll() {
    if (!previousBodyStyles) return;

    root.style.overflow = previousBodyStyles.rootOverflow;
    body.style.position = previousBodyStyles.position;
    body.style.top = previousBodyStyles.top;
    body.style.left = previousBodyStyles.left;
    body.style.right = previousBodyStyles.right;
    body.style.width = previousBodyStyles.width;
    previousBodyStyles = null;

    window.scrollTo(0, savedScrollY);
  }

  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    lockPageScroll();

    panel.classList.add("is-open");
    overlay.classList.add("is-visible");
    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
    panel.setAttribute("aria-hidden", "false");
    panel.inert = false;
    overlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      const firstLink = panel.querySelector(".internal-nav-link");
      firstLink?.focus();
    });
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;

    panel.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    overlay.setAttribute("aria-hidden", "true");

    unlockPageScroll();

    if (restoreFocus) toggle.focus();
  }

  function handleKeydown(event) {
    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function updateBackToTop() {
    scrollUpdateScheduled = false;
    const shouldShow = window.scrollY > 360;
    backToTop.classList.toggle("is-visible", shouldShow);
    backToTop.setAttribute("aria-hidden", String(!shouldShow));
    backToTop.tabIndex = shouldShow ? 0 : -1;
  }

  function requestBackToTopUpdate() {
    if (scrollUpdateScheduled) return;
    scrollUpdateScheduled = true;
    window.requestAnimationFrame(updateBackToTop);
  }

  toggle.addEventListener("click", () => {
    if (isOpen) closeMenu();
    else openMenu();
  });

  overlay.addEventListener("click", () => closeMenu());
  document.addEventListener("keydown", handleKeydown);

  servicesToggle?.addEventListener("click", () => {
    const shouldOpen = servicesToggle.getAttribute("aria-expanded") !== "true";
    setSubmenuOpen(shouldOpen);
  });

  backToTop.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("internal-navigation:cancel-scroll"));
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth"
    });
  });

  window.addEventListener("scroll", requestBackToTopUpdate, { passive: true });
  window.addEventListener("resize", requestBackToTopUpdate);
  window.addEventListener("pageshow", requestBackToTopUpdate);

  setCurrentPage();
  updateBackToTop();
})();
