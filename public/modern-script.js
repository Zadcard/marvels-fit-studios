document.addEventListener("DOMContentLoaded", () => {
  // Core document references
  const root = document.documentElement;
  const body = document.body;
  const siteShell = document.querySelector(".site-shell");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const overlay = document.getElementById("joinOverlay");
  const modalClose = document.getElementById("modalClose");
  const joinButtons = [
    document.getElementById("btnJoinNav"),
    document.getElementById("btnJoinHero"),
    ...Array.from(document.querySelectorAll("[data-open-join]")),
  ].filter(Boolean);
  const btnLogin = document.getElementById("btnLogin");
  const btnLearnMore = document.getElementById("btnLearnMore");
  const aboutSection = document.getElementById("about");
  const faqButtons = Array.from(document.querySelectorAll(".faq-question"));
  const carousels = Array.from(document.querySelectorAll("[data-carousel]"));

  let lastFocused = null;
  let resizeTimer = null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  root.classList.remove("no-js");

  // Shared helpers
  function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((element) => !element.hasAttribute("disabled"));
  }

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

  if (btnLearnMore && aboutSection) {
    btnLearnMore.addEventListener("click", () => {
      aboutSection.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  // Registration modal
  function openModal() {
    if (!overlay) {
      return;
    }

    closeNav();
    lastFocused = document.activeElement;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    setScrollLock(true, "modal-open");

    if (siteShell && "inert" in siteShell) {
      siteShell.inert = true;
    }

    window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(overlay);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });
  }

  function closeModal() {
    if (!overlay) {
      return;
    }

    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    setScrollLock(false, "modal-open");

    if (siteShell && "inert" in siteShell) {
      siteShell.inert = false;
    }

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  joinButtons.forEach((button) => {
    button.addEventListener("click", openModal);
  });

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    });

    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(overlay);
      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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
  handleForm("joinForm", "jf-submit", "jf-success", "Submitting registration...");

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
