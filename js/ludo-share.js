/* Compartilhamento — URLs de matérias estáticas e antigas.
 * O Instagram não permite preencher uma mensagem via URL web.
 * Copia o link e abre o Direct para colar manualmente.
 */
(() => {
  const areas = document.querySelectorAll("[data-ludo-share]");
  if (!areas.length) return;

  const icons = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.7Z"/><path d="M8.4 8.1c-.5.6-.5 1.4 0 2.5 1 2.1 2.8 3.7 5 4.4 1 .3 1.8.1 2.3-.5l.5-1.1-2.2-1-1 1c-1.3-.5-2.3-1.4-2.8-2.6l.8-.9-.9-2.1Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.7" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'
  };

  function pageUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const source = canonical?.href || window.location.href;
    try {
      const url = new URL(source, window.location.href);
      if (url.origin !== window.location.origin) return window.location.href;
      url.hash = "";
      return url.href;
    } catch {
      return window.location.href;
    }
  }

  function pageTitle() {
    return document.querySelector("h1")?.textContent?.trim() ||
      document.title.replace(/\s*\|\s*Ludo Conecta\s*$/i, "");
  }

  async function copyLink(url) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch { /* tenta método compatível abaixo */ }
    }
    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { /* indisponível */ }
    input.remove();
    return copied;
  }

  for (const area of areas) {
    area.innerHTML = [
      '<p class="lc-share__title">Gostou desta matéria? Compartilhe!</p>',
      '<p class="lc-share__intro">Envie este conteúdo para alguém que também ama TCG e Board Games.</p>',
      '<div class="lc-share__buttons">',
      '<a class="lc-share__button lc-share__button--whatsapp" data-share-whatsapp href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="Compartilhar matéria pelo WhatsApp">',
      icons.whatsapp, '<span>WhatsApp</span></a>',
      '<a class="lc-share__button lc-share__button--instagram" data-share-instagram href="https://www.instagram.com/direct/inbox/" target="_blank" rel="noopener noreferrer" aria-label="Copiar link da matéria e abrir Direct do Instagram" title="Copia o link para colar em uma conversa do Instagram">',
      icons.instagram, '<span>Instagram</span></a>',
      '<button class="lc-share__button lc-share__button--copy" type="button" data-share-copy aria-label="Copiar link desta matéria">',
      icons.copy, '<span>Copiar link</span></button>',
      '</div>',
      '<p class="lc-share__feedback" role="status" aria-live="polite"></p>'
    ].join("");

    const status = area.querySelector(".lc-share__feedback");
    area.querySelector("[data-share-whatsapp]").addEventListener("click", (event) => {
      const url = pageUrl();
      const title = pageTitle();
      event.currentTarget.href = "https://wa.me/?text=" +
        encodeURIComponent((title ? title + "\n" : "") + url);
    });

    area.querySelector("[data-share-instagram]").addEventListener("click", () => {
      const url = pageUrl();
      copyLink(url).then((copied) => {
        status.textContent = copied
          ? "Link copiado! Cole a URL em uma conversa no Direct do Instagram."
          : "Se o link não foi copiado, use «Copiar link» e cole no Instagram.";
      });
    });

    area.querySelector("[data-share-copy]").addEventListener("click", async () => {
      const copied = await copyLink(pageUrl());
      status.textContent = copied
        ? "Link da matéria copiado! Agora é só enviar."
        : "Não foi possível copiar automaticamente. Copie a URL na barra do navegador.";
    });
  }
})();
