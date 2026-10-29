document.addEventListener("DOMContentLoaded", () => {
  const videoCarousel = document.querySelector(".video-carousel");

  if (videoCarousel) {
    const track = videoCarousel.querySelector(".video-carousel__track");
    const slides = Array.from(videoCarousel.querySelectorAll(".video-carousel__slide"));
    const dots = Array.from(videoCarousel.querySelectorAll(".video-carousel__dot"));
    const prevButton = videoCarousel.querySelector(".video-carousel__arrow--prev");
    const nextButton = videoCarousel.querySelector(".video-carousel__arrow--next");

    let currentSlide = 0;

    function pauseVideos() {
      slides.forEach((slide) => {
        const frame = slide.querySelector("iframe");

        frame?.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "pauseVideo",
            args: "",
          }),
          "*",
        );
      });
    }

    function showSlide(index) {
      if (!slides.length || !track) {
        return;
      }

      pauseVideos();

      currentSlide = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === currentSlide;

        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === currentSlide;

        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });

      if (typeof window.gtag === "function") {
        window.gtag("event", "video_carousel_view", {
          video_position: currentSlide + 1,
        });
      }
    }

    prevButton?.addEventListener("click", () => {
      showSlide(currentSlide - 1);
    });

    nextButton?.addEventListener("click", () => {
      showSlide(currentSlide + 1);
    });

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showSlide(index);
      });
    });

    let touchStartX = 0;

    videoCarousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX || 0;
      },
      { passive: true },
    );

    videoCarousel.addEventListener(
      "touchend",
      (event) => {
        const touchEndX = event.changedTouches[0]?.clientX || 0;
        const distance = touchEndX - touchStartX;

        if (Math.abs(distance) < 45) {
          return;
        }

        showSlide(distance < 0 ? currentSlide + 1 : currentSlide - 1);
      },
      { passive: true },
    );

    showSlide(0);
  }

  const postsSection = document.querySelector(".conecta-posts");
  const postsContainer = document.querySelector("#ludo-posts");
  const filtersContainer = document.querySelector("#ludo-filters");
  const featuredCarousel = document.querySelector(".featured-carousel");
  const featuredTrack = document.querySelector("#ludo-featured-track");
  const featuredDots = document.querySelector("#ludo-featured-dots");

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(`${value}T12:00:00`);

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function renderFeaturedPosts(posts) {
    if (!featuredCarousel || !featuredTrack || !featuredDots) {
      return;
    }

    const featuredPosts = posts.filter((post) => post.featured);

    if (!featuredPosts.length) {
      featuredCarousel.hidden = true;
      return;
    }

    featuredTrack.innerHTML = featuredPosts
      .map(
        (post, index) => `
          <article class="featured-card${index === 0 ? " is-active" : ""}" data-featured-slide="${index}">
            <a href="${post.url}" aria-label="Ler ${post.title}">
              <div class="featured-card__image">
                <img
                  src="${post.image}"
                  alt="${post.imageAlt || post.title}"
                  loading="${index === 0 ? "eager" : "lazy"}"
                >
              </div>

              <div class="featured-card__overlay"></div>

              <div class="featured-card__content">
                <div class="featured-card__meta">
                  <span>${post.category || "Ludo Conecta"}</span>
                  ${post.date ? `<time datetime="${post.date}">${formatDate(post.date)}</time>` : ""}
                </div>

                <h3>${post.title}</h3>
                <p>${post.summary || ""}</p>
                <span class="featured-card__link">Ler destaque →</span>
              </div>
            </a>
          </article>
        `,
      )
      .join("");

    featuredDots.innerHTML = featuredPosts
      .map(
        (_, index) => `
          <button
            class="featured-carousel__dot${index === 0 ? " is-active" : ""}"
            type="button"
            data-featured-dot="${index}"
            aria-label="Destaque ${index + 1}"
            aria-pressed="${index === 0 ? "true" : "false"}"
          ></button>
        `,
      )
      .join("");

    const slides = Array.from(featuredTrack.querySelectorAll(".featured-card"));
    const dots = Array.from(featuredDots.querySelectorAll(".featured-carousel__dot"));
    const prevButton = featuredCarousel.querySelector(".featured-carousel__arrow--prev");
    const nextButton = featuredCarousel.querySelector(".featured-carousel__arrow--next");

    let currentFeatured = 0;

    function showFeatured(index) {
      currentFeatured = (index + slides.length) % slides.length;
      featuredTrack.style.transform = `translateX(-${currentFeatured * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === currentFeatured;

        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === currentFeatured;

        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });

      if (typeof window.gtag === "function") {
        window.gtag("event", "featured_article_view", {
          article_position: currentFeatured + 1,
          article_title: featuredPosts[currentFeatured]?.title || "",
        });
      }
    }

    prevButton?.addEventListener("click", () => {
      showFeatured(currentFeatured - 1);
    });

    nextButton?.addEventListener("click", () => {
      showFeatured(currentFeatured + 1);
    });

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showFeatured(index);
      });
    });

    let touchStartX = 0;

    featuredCarousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX || 0;
      },
      { passive: true },
    );

    featuredCarousel.addEventListener(
      "touchend",
      (event) => {
        const touchEndX = event.changedTouches[0]?.clientX || 0;
        const distance = touchEndX - touchStartX;

        if (Math.abs(distance) < 45) {
          return;
        }

        showFeatured(distance < 0 ? currentFeatured + 1 : currentFeatured - 1);
      },
      { passive: true },
    );

    featuredCarousel.hidden = false;
    showFeatured(0);
  }

  async function loadPosts() {
    try {
      const response = await fetch("../content/ludo-conecta/posts.json", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const posts = await response.json();

      if (!Array.isArray(posts) || posts.length === 0) {
        return;
      }

      renderFeaturedPosts(posts);

      if (!postsSection || !postsContainer || !filtersContainer) {
        return;
      }

      const regularPosts = posts.filter((post) => !post.featured);

      if (!regularPosts.length) {
        postsSection.hidden = true;
        return;
      }

      const categories = [
        "Todos",
        ...new Set(regularPosts.map((post) => post.category).filter(Boolean)),
      ];

      let activeCategory = "Todos";

      function renderPosts() {
        const visiblePosts =
          activeCategory === "Todos"
            ? regularPosts
            : regularPosts.filter((post) => post.category === activeCategory);

        postsContainer.innerHTML = visiblePosts
          .map(
            (post) => `
              <article class="conecta-post-card">
                <a href="${post.url}" aria-label="Ler ${post.title}">
                  <div class="conecta-post-card__image">
                    <img
                      src="${post.image}"
                      alt="${post.imageAlt || post.title}"
                      loading="lazy"
                    >
                  </div>

                  <div class="conecta-post-card__content">
                    <div class="conecta-post-card__meta">
                      <span>${post.category || "Ludo Conecta"}</span>
                      ${post.date ? `<span>•</span><time datetime="${post.date}">${formatDate(post.date)}</time>` : ""}
                    </div>

                    <h3>${post.title}</h3>
                    <p>${post.summary || ""}</p>
                    <span class="conecta-post-card__link">Ler conteúdo →</span>
                  </div>
                </a>
              </article>
            `,
          )
          .join("");
      }

      filtersContainer.innerHTML = categories
        .map(
          (category, index) => `
            <button
              class="conecta-filter${index === 0 ? " is-active" : ""}"
              type="button"
              data-category="${category}"
            >
              ${category}
            </button>
          `,
        )
        .join("");

      filtersContainer.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");

        if (!button) {
          return;
        }

        activeCategory = button.dataset.category || "Todos";

        filtersContainer
          .querySelectorAll(".conecta-filter")
          .forEach((filterButton) => {
            filterButton.classList.toggle(
              "is-active",
              filterButton === button,
            );
          });

        renderPosts();
      });

      renderPosts();
      postsSection.hidden = false;
    } catch {
      if (postsSection) {
        postsSection.hidden = true;
      }
    }
  }

  loadPosts();
});
