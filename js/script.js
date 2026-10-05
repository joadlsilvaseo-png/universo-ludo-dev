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
    if (window.innerWidth > 1280) {
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
