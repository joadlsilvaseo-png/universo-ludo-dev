/* =========================================================
UNIVERSO LUDO
JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
  ELEMENTOS
  ========================================================= */

  const header = document.querySelector(".header");
  const menuButton = document.querySelector(".header__menu-button");
  const navigation = document.querySelector(".header__nav");
  const navigationLinks = document.querySelectorAll(".header__nav a");
  const currentYear = document.querySelector("#current-year");

  /* =========================================================
  ANALYTICS — CLIQUES EM TODOS OS LINKS
  ========================================================= */

  function getAnalyticsSection(anchor) {
    const section = anchor.closest("section[id]");

    if (section?.id) {
      return section.id;
    }

    if (anchor.closest("header")) {
      return "header";
    }

    if (anchor.closest("footer")) {
      return "footer";
    }

    if (anchor.closest("nav")) {
      return "navigation";
    }

    return "page";
  }

  function getAnalyticsLinkType(anchor) {
    const href = anchor.getAttribute("href") || "";

    if (href.startsWith("#")) {
      return "internal_navigation";
    }

    if (href.startsWith("tel:")) {
      return "phone";
    }

    if (href.includes("wa.me") || href.includes("whatsapp.com")) {
      return "whatsapp";
    }

    if (href.includes("instagram.com")) {
      return "instagram";
    }

    if (href.includes("ligamagic.com.br")) {
      return "online_store";
    }

    if (href.includes("universoludo.rejoy.com.br")) {
      return "rental";
    }

    if (href.includes("events.pokemon.com")) {
      return "championship_pokemon";
    }

    if (href.includes("ravensburgerplay.com")) {
      return "championship_lorcana";
    }

    if (href.includes("google.com/maps")) {
      return "maps";
    }

    try {
      const url = new URL(href, window.location.href);

      return url.origin === window.location.origin
        ? "internal"
        : "external";
    } catch {
      return "other";
    }
  }

  function trackLinkClick(anchor) {
    if (typeof window.gtag !== "function") {
      return;
    }

    const href = anchor.getAttribute("href") || "";
    const linkText =
      anchor.getAttribute("aria-label") ||
      anchor.textContent?.replace(/\s+/g, " ").trim() ||
      "(sem texto)";

    let linkDomain = window.location.hostname;
    let outbound = false;

    try {
      const url = new URL(href, window.location.href);

      linkDomain = url.hostname || window.location.hostname;
      outbound =
        !href.startsWith("#") &&
        !href.startsWith("tel:") &&
        url.origin !== window.location.origin;
    } catch {
      linkDomain = "";
    }

    const linkType = getAnalyticsLinkType(anchor);
    const linkSection = getAnalyticsSection(anchor);

    const eventParams = {
      link_url: href,
      link_text: linkText.slice(0, 100),
      link_id: anchor.id || "",
      link_classes: anchor.className || "",
      link_domain: linkDomain,
      outbound: outbound ? 1 : 0,
      link_type: linkType,
      link_section: linkSection,
    };

    window.gtag("event", "link_click", eventParams);

    const commercialEvents = {
      whatsapp: "click_whatsapp",
      phone: "click_phone",
      online_store: "click_online_store",
      rental: "click_rental",
      maps: "click_maps",
      championship_pokemon: "click_championship",
      championship_lorcana: "click_championship",
    };

    const commercialEventName = commercialEvents[linkType];

    if (commercialEventName) {
      window.gtag("event", commercialEventName, {
        ...eventParams,
        championship_type:
          linkType === "championship_pokemon"
            ? "pokemon"
            : linkType === "championship_lorcana"
              ? "lorcana"
              : "",
      });
    }
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");

    if (!anchor) {
      return;
    }

    trackLinkClick(anchor);
  });

  /* =========================================================
  ANO AUTOMÁTICO
  ========================================================= */

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  /* =========================================================
  MENU MOBILE
  ========================================================= */

  function openMenu() {
    if (!menuButton || !navigation) return;

    navigation.classList.add("is-open");
    header?.classList.add("menu-open");

    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Fechar menu");

    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    if (!menuButton || !navigation) return;

    navigation.classList.remove("is-open");
    header?.classList.remove("menu-open");

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");

    document.body.classList.remove("menu-open");
  }

  function toggleMenu() {
    const isOpen = navigation?.classList.contains("is-open");

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuButton) {
    menuButton.addEventListener("click", toggleMenu);
  }

  /* =========================================================
  FECHAR MENU AO CLICAR EM UM LINK
  ========================================================= */

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  /* =========================================================
  FECHAR MENU COM ESC
  ========================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  /* =========================================================
  RESETAR MENU AO VOLTAR PARA DESKTOP
  ========================================================= */

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) {
      closeMenu();
    }
  });

  /* =========================================================
  HEADER AO ROLAR A PÁGINA
  ========================================================= */

  function updateHeader() {
    if (!header) return;

    if (window.scrollY > 20) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  updateHeader();

  window.addEventListener("scroll", updateHeader, {
    passive: true,
  });

  /* =========================================================
  SCROLL SUAVE PARA ÂNCORAS INTERNAS
  ========================================================= */

  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      /*
      Links temporários que ainda estão com href="#"
      não devem jogar o usuário para o topo.
      */

      if (!targetId || targetId === "#") {
        event.preventDefault();
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      const headerHeight = header?.offsetHeight || 0;

      const targetPosition =
        target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    });
  });

  /* =========================================================
  FECHAR MENU CLICANDO FORA
  ========================================================= */

  document.addEventListener("click", (event) => {
    if (!navigation || !menuButton || !header) return;

    const isMenuOpen = navigation.classList.contains("is-open");

    if (!isMenuOpen) return;

    const clickedInsideHeader = header.contains(event.target);

    if (!clickedInsideHeader) {
      closeMenu();
    }
  });

  /* =========================================================
  MODAL DE INSCRIÇÃO - CAMPEONATOS
  ========================================================= */

  const registrationModal = document.querySelector("#registration-modal");

  const registrationOpenButton = document.querySelector(
    "#open-registration-modal",
  );

  const registrationCloseButton = registrationModal?.querySelector(
    ".registration-modal__close",
  );

  if (registrationModal && registrationOpenButton) {
    /* ABRIR MODAL */

    registrationOpenButton.addEventListener("click", () => {
      registrationModal.showModal();
    });

    /* FECHAR NO X */

    registrationCloseButton?.addEventListener("click", () => {
      registrationModal.close();
    });

    /* FECHAR AO CLICAR FORA */

    registrationModal.addEventListener("click", (event) => {
      if (event.target !== registrationModal) return;

      const rect = registrationModal.getBoundingClientRect();

      const clickedOutside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;

      if (clickedOutside) {
        registrationModal.close();
      }
    });

    /* FECHAR COM ESC É NATIVO DO DIALOG */
  }

  /* =========================================================
  CARROSSEL - CAMPEONATOS
  ========================================================= */

  const championshipsCarousel = document.querySelector(
    ".championships-carousel",
  );

  if (championshipsCarousel) {
    const extraChampionshipImages = [
      {
        src: "./assets/carrossel-campeonatos-02.png",
        alt: "Campeonato Universo Ludo - foto 2",
      },
      {
        src: "./assets/carrossel-campeonatos-03.png",
        alt: "Campeonato Universo Ludo - foto 3",
      },
      {
        src: "./assets/carrossel-campeonatos-04.png",
        alt: "Campeonato Universo Ludo - foto 4",
      },
      {
        src: "./assets/carrossel-campeonatos-05.png",
        alt: "Campeonato Universo Ludo - foto 5",
      },
    ];

    let slides = Array.from(
      championshipsCarousel.querySelectorAll(
        ".championships-carousel__slide",
      ),
    );

    let dots = Array.from(
      championshipsCarousel.querySelectorAll(
        ".championships-carousel__dot",
      ),
    );

    const slidesContainer = championshipsCarousel.querySelector(
      ".championships-carousel__slides",
    );

    const dotsContainer = championshipsCarousel.querySelector(
      ".championships-carousel__dots",
    );

    const prevButton = championshipsCarousel.querySelector(
      ".championships-carousel__arrow--prev",
    );

    const nextButton = championshipsCarousel.querySelector(
      ".championships-carousel__arrow--next",
    );

    let currentSlide = 0;
    let autoplay = null;
    let isHovering = false;
    let hasFocus = false;

    function showChampionshipSlide(index) {
      currentSlide = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        const active = i === currentSlide;

        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, i) => {
        const active = i === currentSlide;

        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });
    }

    function stopChampionshipAutoplay() {
      clearInterval(autoplay);
      autoplay = null;
    }

    function startChampionshipAutoplay() {
      stopChampionshipAutoplay();

      if (
        slides.length < 2 ||
        document.hidden ||
        isHovering ||
        hasFocus
      ) {
        return;
      }

      autoplay = setInterval(() => {
        showChampionshipSlide(currentSlide + 1);
      }, 5000);
    }

    function goToChampionshipSlide(index) {
      showChampionshipSlide(index);
      startChampionshipAutoplay();
    }

    function bindChampionshipDots() {
      dots.forEach((dot, index) => {
        if (dot.dataset.bound === "true") {
          return;
        }

        dot.dataset.bound = "true";
        dot.addEventListener("click", () => {
          goToChampionshipSlide(index);
        });
      });
    }

    function preloadChampionshipImage(imageData) {
      return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => resolve(imageData);
        image.onerror = () => resolve(null);
        image.src = imageData.src;
      });
    }

    async function loadExtraChampionshipImages() {
      const loadedImages = await Promise.all(
        extraChampionshipImages.map(preloadChampionshipImage),
      );

      loadedImages
        .filter(Boolean)
        .forEach((imageData) => {
          const slide = document.createElement("div");
          slide.className = "championships-carousel__slide";
          slide.setAttribute("aria-hidden", "true");

          const image = document.createElement("img");
          image.src = imageData.src;
          image.alt = imageData.alt;
          image.loading = "lazy";

          slide.appendChild(image);
          slidesContainer?.appendChild(slide);

          const dot = document.createElement("button");
          dot.className = "championships-carousel__dot";
          dot.type = "button";
          dot.setAttribute("aria-label", `Foto ${slides.length + 1}`);
          dot.dataset.slide = String(slides.length);

          dotsContainer?.appendChild(dot);

          slides.push(slide);
          dots.push(dot);
        });

      bindChampionshipDots();
      showChampionshipSlide(0);
      startChampionshipAutoplay();
    }

    prevButton?.addEventListener("click", () => {
      goToChampionshipSlide(currentSlide - 1);
    });

    nextButton?.addEventListener("click", () => {
      goToChampionshipSlide(currentSlide + 1);
    });

    championshipsCarousel.addEventListener("mouseenter", () => {
      isHovering = true;
      stopChampionshipAutoplay();
    });

    championshipsCarousel.addEventListener("mouseleave", () => {
      isHovering = false;
      startChampionshipAutoplay();
    });

    championshipsCarousel.addEventListener("focusin", () => {
      hasFocus = true;
      stopChampionshipAutoplay();
    });

    championshipsCarousel.addEventListener("focusout", (event) => {
      if (!championshipsCarousel.contains(event.relatedTarget)) {
        hasFocus = false;
        startChampionshipAutoplay();
      }
    });

    document.addEventListener(
      "visibilitychange",
      startChampionshipAutoplay,
    );

    bindChampionshipDots();

    if (slides.length) {
      showChampionshipSlide(0);
      loadExtraChampionshipImages();
    }
  }

  /* =========================================================
  CARROSSEL DO HERO
  ========================================================= */

  const carousel = document.querySelector(".hero-carousel");

  if (carousel) {
    const slides = Array.from(
      carousel.querySelectorAll(".hero-carousel__slide"),
    );

    const dots = Array.from(carousel.querySelectorAll(".hero-carousel__dot"));

    const prevButton = carousel.querySelector(".hero-carousel__arrow--prev");

    const nextButton = carousel.querySelector(".hero-carousel__arrow--next");

    let currentSlide = 0;
    let autoplay = null;
    let isHovering = false;
    let hasFocus = false;

    /* EXIBIR IMAGEM */

    function showSlide(index) {
      currentSlide = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        const active = i === currentSlide;

        slide.classList.toggle("is-active", active);

        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, i) => {
        const active = i === currentSlide;

        dot.classList.toggle("is-active", active);

        dot.setAttribute("aria-pressed", String(active));
      });
    }

    /* PARAR ROTAÇÃO */

    function stopAutoplay() {
      clearInterval(autoplay);
      autoplay = null;
    }

    /* INICIAR ROTAÇÃO */

    function startAutoplay() {
      stopAutoplay();

      if (slides.length < 2 || document.hidden || isHovering || hasFocus) {
        return;
      }

      autoplay = setInterval(() => {
        showSlide(currentSlide + 1);
      }, 5000);
    }

    /* NAVEGAÇÃO MANUAL */

    function goToSlide(index) {
      showSlide(index);
      startAutoplay();
    }

    prevButton?.addEventListener("click", () => {
      goToSlide(currentSlide - 1);
    });

    nextButton?.addEventListener("click", () => {
      goToSlide(currentSlide + 1);
    });

    /* INDICADORES */

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        goToSlide(index);
      });
    });

    /* PAUSAR AO PASSAR O MOUSE */

    carousel.addEventListener("mouseenter", () => {
      isHovering = true;
      stopAutoplay();
    });

    carousel.addEventListener("mouseleave", () => {
      isHovering = false;
      startAutoplay();
    });

    /* PAUSAR COM FOCO NOS CONTROLES */

    carousel.addEventListener("focusin", () => {
      hasFocus = true;
      stopAutoplay();
    });

    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        hasFocus = false;
        startAutoplay();
      }
    });

    /* PAUSAR EM OUTRAS ABAS */

    document.addEventListener("visibilitychange", startAutoplay);

    /* INICIALIZAÇÃO */

    if (slides.length) {
      showSlide(0);
      startAutoplay();
    }
  }
});
