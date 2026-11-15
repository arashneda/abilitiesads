(() => {
  "use strict";

  const progressBar = document.getElementById("readingProgress");
  const articleBody = document.querySelector(".article-body");
  const toc = document.getElementById("articleToc");

  if (!progressBar || !articleBody || !toc) return;

  const tocLinks = Array.from(toc.querySelectorAll('a[href^="#"]'));
  const sections = tocLinks
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter(Boolean);

  let scheduled = false;

  function updateReadingUI() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;

    let activeSection = sections[0] || null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 150) activeSection = section;
      else break;
    }

    tocLinks.forEach((link) => {
      const isActive = activeSection && link.hash === `#${activeSection.id}`;
      if (isActive) link.classList.add("active");
      else link.classList.remove("active");
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    scheduled = false;
  }

  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateReadingUI);
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scrollAnimationFrame = null;

  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function animateToSection(target, link) {
    if (scrollAnimationFrame !== null) {
      window.cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }

    const targetTop = window.scrollY + target.getBoundingClientRect().top - 30;
    const startTop = window.scrollY;
    const distance = targetTop - startTop;

    if (prefersReducedMotion || Math.abs(distance) < 1) {
      window.scrollTo(0, targetTop);
      history.pushState(null, "", link.hash);
      requestUpdate();
      return;
    }

    const duration = 1000;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startTop + distance * easeInOutCubic(progress));

      if (progress < 1) {
        scrollAnimationFrame = window.requestAnimationFrame(step);
      } else {
        scrollAnimationFrame = null;
        history.pushState(null, "", link.hash);
        requestUpdate();
      }
    }

    scrollAnimationFrame = window.requestAnimationFrame(step);
  }

  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      animateToSection(target, link);
    });
  });

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);
  updateReadingUI();
})();