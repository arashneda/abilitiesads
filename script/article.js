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

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);
  updateReadingUI();
})();