document.addEventListener("DOMContentLoaded", () => {
  // Core document references
  const root = document.documentElement;
  const body = document.body;
  const siteShell = document.querySelector(".site-shell");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const btnLogin = document.getElementById("btnLogin");
  const btnJoinNav = document.getElementById("btnJoinNav");
  const btnJoinHero = document.getElementById("btnJoinHero");
  const btnLearnMore = document.getElementById("btnLearnMore");
  const contactSection = document.getElementById("contact");
  const aboutSection = document.getElementById("about");
  const faqButtons = Array.from(document.querySelectorAll(".faq-question"));
  const carousels = Array.from(document.querySelectorAll("[data-carousel]"));

  let resizeTimer = null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  root.classList.remove("no-js");

  // Shared helpers
  function setScrollLock(isLocked, className) {
    body.classList.toggle(className, isLocked);
  }

  function closeNav() {
    if (!navLinks || !navToggle) {
      return;
    }

    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    setScrollLock(false, "nav-open");
  }

  function scrollToEl(el) {
    if (!el) return;
    const headerHeight = document.querySelector(".site-header")?.offsetHeight || 80;
    const targetTop = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10;

    // Use a robust scroll method that bypasses the reduced-motion check for these specific manual calls
    // since the user explicitly requested visible smooth scrolling.
    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }

  // Global scroll handler for anchors and data-scroll-to elements
  document.addEventListener("click", (event) => {
    const targetLink = event.target.closest('a[href^="#"]');
    const scrollButton = event.target.closest("[data-scroll-to]");

    if (targetLink) {
      const targetId = targetLink.getAttribute("href");
      if (targetId === "#") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        event.preventDefault();
        
        // Sequence: Start scroll, then close nav if it was open
        // This prevents the layout shift from the closing menu from breaking the scroll target calculation
        scrollToEl(targetEl);
        
        if (navLinks.classList.contains("open")) {
          setTimeout(closeNav, 10);
        }
      }
    } else if (scrollButton) {
      const targetId = scrollButton.getAttribute("data-scroll-to");
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        scrollToEl(targetEl);
      }
    }
  });

  // Mobile navigation
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      setScrollLock(isOpen, "nav-open");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("click", (event) => {
      if (!navLinks.classList.contains("open")) {
        return;
      }

      if (navLinks.contains(event.target) || navToggle.contains(event.target)) {
        return;
      }

      closeNav();
    });
  }

  // Header actions
  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      window.location.href = "/login";
    });
  }

  if (btnJoinNav) {
    btnJoinNav.addEventListener("click", () => {
      closeNav();
      scrollToEl(contactSection);
    });
  }

  if (btnJoinHero) {
    btnJoinHero.addEventListener("click", () => {
      scrollToEl(contactSection);
    });
  }

  if (btnLearnMore && aboutSection) {
    btnLearnMore.addEventListener("click", () => {
      scrollToEl(aboutSection);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  // FAQ accordion
  function closeAllFaq() {
    faqButtons.forEach((button) => {
      const targetId = button.getAttribute("aria-controls");
      const target = targetId ? document.getElementById(targetId) : null;
      button.setAttribute("aria-expanded", "false");
      if (target) {
        target.classList.remove("open");
      }
    });
  }

  faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      const targetId = button.getAttribute("aria-controls");
      const target = targetId ? document.getElementById(targetId) : null;

      closeAllFaq();

      if (!expanded && target) {
        button.setAttribute("aria-expanded", "true");
        target.classList.add("open");
      }
    });
  });

  // Smooth carousels with swipe / drag / keyboard support
  function initCarousel(shell) {
    const track = shell.querySelector(".carousel-track");
    const prevButton = shell.querySelector("[data-carousel-prev]");
    const nextButton = shell.querySelector("[data-carousel-next]");
    const status = shell.querySelector("[data-carousel-status]");

    if (!track || !prevButton || !nextButton) {
      return null;
    }

    const slides = Array.from(track.children);
    if (!slides.length) {
      return null;
    }

    let pointerActive = false;
    let startX = 0;
    let startScroll = 0;
    let rafId = 0;

    function getNearestIndex() {
      const currentScroll = track.scrollLeft;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft - currentScroll);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      return nearestIndex;
    }

    function getVisibleSlides() {
      const slideWidth = slides[0].getBoundingClientRect().width || 1;
      return Math.max(1, Math.round(track.clientWidth / slideWidth));
    }

    function updateUI() {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth - 2);
      const currentIndex = getNearestIndex();
      const visibleSlides = getVisibleSlides();
      const lastVisibleIndex = Math.min(slides.length, currentIndex + visibleSlides);

      prevButton.disabled = track.scrollLeft <= 2;
      nextButton.disabled = track.scrollLeft >= maxScroll;

      if (status) {
        status.textContent = `${currentIndex + 1}-${lastVisibleIndex} of ${slides.length}`;
      }
    }

    function requestUpdate() {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        updateUI();
        rafId = 0;
      });
    }

    function scrollToIndex(index) {
      const boundedIndex = Math.max(0, Math.min(index, slides.length - 1));
      track.scrollTo({
        left: slides[boundedIndex].offsetLeft,
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      });
    }

    function moveBy(direction) {
      const currentIndex = getNearestIndex();
      scrollToIndex(currentIndex + direction);
    }

    prevButton.addEventListener("click", () => moveBy(-1));
    nextButton.addEventListener("click", () => moveBy(1));

    track.addEventListener("scroll", requestUpdate, { passive: true });

    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveBy(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveBy(1);
      }
    });

    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      pointerActive = true;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(event.pointerId);
      track.style.cursor = "grabbing";
    });

    track.addEventListener("pointermove", (event) => {
      if (!pointerActive) {
        return;
      }

      const delta = event.clientX - startX;
      track.scrollLeft = startScroll - delta;
    });

    function releasePointer(event) {
      if (!pointerActive) {
        return;
      }

      pointerActive = false;
      track.style.cursor = "";
      if (event && typeof track.releasePointerCapture === "function") {
        try {
          track.releasePointerCapture(event.pointerId);
        } catch {
          // Ignore pointer capture release errors for browsers that already released it.
        }
      }
    }

    track.addEventListener("pointerup", releasePointer);
    track.addEventListener("pointercancel", releasePointer);
    track.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") {
        releasePointer(event);
      }
    });

    updateUI();
    return updateUI;
  }

  const carouselRefreshers = carousels.map(initCarousel).filter(Boolean);

  // Lightweight form handling
  function handleForm(formId, submitId, successId, loadingText) {
    const form = document.getElementById(formId);
    const submitButton = document.getElementById(submitId);
    const successMessage = document.getElementById(successId);

    if (!form || !submitButton || !successMessage) {
      return;
    }

    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const privacyInput = form.querySelector('[name="privacy"]');
    const trackedInputs = [nameInput, phoneInput].filter(Boolean);

    function setInvalidState(input, isInvalid) {
      if (!input) {
        return;
      }

      input.setAttribute("aria-invalid", String(isInvalid));
    }

    trackedInputs.forEach((input) => {
      input.addEventListener("input", () => {
        setInvalidState(input, false);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const nameValue = nameInput ? nameInput.value.trim() : "";
      const phoneValue = phoneInput ? phoneInput.value.trim() : "";
      const hasConsent = privacyInput ? privacyInput.checked : false;

      trackedInputs.forEach((input) => setInvalidState(input, false));

      if (nameInput && !nameValue) {
        setInvalidState(nameInput, true);
        nameInput.focus();
        nameInput.reportValidity();
        return;
      }

      if (phoneInput && !phoneValue) {
        setInvalidState(phoneInput, true);
        phoneInput.focus();
        phoneInput.reportValidity();
        return;
      }

      if (!hasConsent) {
        privacyInput.reportValidity();
        return;
      }

      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitButton.textContent = loadingText;

      window.setTimeout(() => {
        form.querySelectorAll("input, select, textarea, button").forEach((field) => {
          field.disabled = true;
        });
        submitButton.setAttribute("aria-busy", "false");
        successMessage.classList.add("show");
      }, 350);
    });
  }

  handleForm("contactForm", "cf-submit", "cf-success", "Sending request...");

  // Global resize handling
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.innerWidth > 860) {
        closeNav();
      }

      carouselRefreshers.forEach((refresh) => refresh());
    }, 120);
  });
});
