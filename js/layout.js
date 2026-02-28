const resolveBasePath = () => {
  const customBasePath = document.body?.dataset.basePath;
  if (customBasePath) {
    return customBasePath;
  }

  const path = window.location.pathname;
  if (path.includes('/tools/') || path.includes('/pages/')) {
    return '../';
  }

  return './';
};

const renderSiteHeader = (basePath) => {
  const header = document.getElementById('site-header');
  if (!header) return;

  header.className = 'site-header';
  header.innerHTML = `
    <div class="container header-row">
      <a href="${basePath}index.html" class="logo">MediaTools Pro</a>
      <nav class="main-nav" aria-label="Main Navigation">
        <a href="${basePath}index.html">Home</a>
        <a href="${basePath}pages/about.html">About</a>
        <a href="${basePath}pages/contact.html">Contact</a>
        <a href="${basePath}pages/privacy.html">Privacy</a>
        <a href="${basePath}pages/terms.html">Terms</a>
        <a href="${basePath}pages/faq.html">FAQs</a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Toggle dark and light mode" aria-pressed="false">🌙 Dark Mode</button>
    </div>
  `;
};

const renderSiteFooter = (basePath) => {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container footer-links">
      <a href="${basePath}pages/about.html">About</a>
      <a href="${basePath}pages/contact.html">Contact</a>
      <a href="${basePath}pages/privacy.html">Privacy Policy</a>
      <a href="${basePath}pages/terms.html">Terms</a>
      <a href="${basePath}pages/faq.html">FAQs</a>
    </div>
    <p class="container copyright">© 2026 MediaTools Pro. All rights reserved.</p>
  `;
};

const basePath = resolveBasePath();
renderSiteHeader(basePath);
renderSiteFooter(basePath);
