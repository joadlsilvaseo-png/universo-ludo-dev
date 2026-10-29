document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector(".video-carousel");

  if (carousel) {
    const track = carousel.querySelector(".video-carousel__track");
    const slides = Array.from(carousel.querySelectorAll(".video-carousel__slide"));
    const dots = Array.from(carousel.querySelectorAll(".video-carousel__dot"));
    const prevButton = carousel.querySelector(".video-carousel__arrow--prev");
    const nextButton = carousel.querySelector(".video-carousel__arrow--next");

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

    carousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX || 0;
      },
      { passive: true },
    );

    carousel.addEventListener(
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

  async function loadPosts() {
    if (!postsSection || !postsContainer || !filtersContainer) {
      return;
    }

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

      const categories = [
        "Todos",
        ...new Set(posts.map((post) => post.category).filter(Boolean)),
      ];

      let activeCategory = "Todos";

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

      function renderPosts() {
        const visiblePosts =
          activeCategory === "Todos"
            ? posts
            : posts.filter((post) => post.category === activeCategory);

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
      postsSection.hidden = true;
    }
  }

  loadPosts();
});
