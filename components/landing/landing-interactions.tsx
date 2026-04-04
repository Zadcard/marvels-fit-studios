"use client";

import { useEffect } from "react";

export function LandingInteractions() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    const btnJoinNav = document.getElementById("btnJoinNav");
    const btnJoinHero = document.getElementById("btnJoinHero");
    const btnLearnMore = document.getElementById("btnLearnMore");
    const contactSection = document.getElementById("contact");
    const aboutSection = document.getElementById("about");
    const faqButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".faq-question")
    );
    const carousels = Array.from(
      document.querySelectorAll<HTMLElement>("[data-carousel]")
    );

    let resizeTimer: number | undefined;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const cleanups: Array<() => void> = [];

    root.classList.remove("no-js");

    function setScrollLock(isLocked: boolean, className: string) {
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

    function scrollToEl(el: Element | null) {
      if (!el) {
        return;
      }

      const headerHeight =
        document.querySelector<HTMLElement>(".site-header")?.offsetHeight || 80;
      const targetTop =
        el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10;

      window.scrollTo({
        top: targetTop,
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      });
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const targetLink = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      const scrollButton = target?.closest<HTMLElement>("[data-scroll-to]");

      if (targetLink) {
        const targetId = targetLink.getAttribute("href");
        if (targetId === "#") {
          return;
        }

        const targetEl = targetId ? document.querySelector(targetId) : null;
        if (targetEl) {
          event.preventDefault();
          scrollToEl(targetEl);

          if (navLinks?.classList.contains("open")) {
            window.setTimeout(closeNav, 10);
          }
        }

        return;
      }

      if (scrollButton) {
        const targetId = scrollButton.getAttribute("data-scroll-to");
        const targetEl = targetId ? document.querySelector(targetId) : null;
        if (targetEl) {
          scrollToEl(targetEl);
        }
      }
    };

    document.addEventListener("click", handleDocumentClick);
    cleanups.push(() =>
      document.removeEventListener("click", handleDocumentClick)
    );

    if (navToggle && navLinks) {
      const handleNavToggleClick = () => {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        setScrollLock(isOpen, "nav-open");
      };

      navToggle.addEventListener("click", handleNavToggleClick);
      cleanups.push(() =>
        navToggle.removeEventListener("click", handleNavToggleClick)
      );

      const navLinkClickHandlers = Array.from(
        navLinks.querySelectorAll<HTMLAnchorElement>("a")
      ).map((link) => {
        const handler = () => closeNav();
        link.addEventListener("click", handler);
        return () => link.removeEventListener("click", handler);
      });
      cleanups.push(...navLinkClickHandlers);

      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!navLinks.classList.contains("open")) {
          return;
        }

        if (
          (target && navLinks.contains(target)) ||
          (target && navToggle.contains(target))
        ) {
          return;
        }

        closeNav();
      };

      document.addEventListener("click", handleOutsideClick);
      cleanups.push(() =>
        document.removeEventListener("click", handleOutsideClick)
      );
    }

    if (btnJoinNav) {
      const handleJoinNavClick = () => {
        closeNav();
        scrollToEl(contactSection);
      };

      btnJoinNav.addEventListener("click", handleJoinNavClick);
      cleanups.push(() =>
        btnJoinNav.removeEventListener("click", handleJoinNavClick)
      );
    }

    if (btnJoinHero) {
      const handleJoinHeroClick = () => scrollToEl(contactSection);
      btnJoinHero.addEventListener("click", handleJoinHeroClick);
      cleanups.push(() =>
        btnJoinHero.removeEventListener("click", handleJoinHeroClick)
      );
    }

    if (btnLearnMore && aboutSection) {
      const handleLearnMoreClick = () => scrollToEl(aboutSection);
      btnLearnMore.addEventListener("click", handleLearnMoreClick);
      cleanups.push(() =>
        btnLearnMore.removeEventListener("click", handleLearnMoreClick)
      );
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNav();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    cleanups.push(() =>
      document.removeEventListener("keydown", handleEscapeKey)
    );

    function closeAllFaq() {
      faqButtons.forEach((button) => {
        const targetId = button.getAttribute("aria-controls");
        const target = targetId ? document.getElementById(targetId) : null;
        button.setAttribute("aria-expanded", "false");
        target?.classList.remove("open");
      });
    }

    faqButtons.forEach((button) => {
      const handleFaqClick = () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        const targetId = button.getAttribute("aria-controls");
        const target = targetId ? document.getElementById(targetId) : null;

        closeAllFaq();

        if (!expanded && target) {
          button.setAttribute("aria-expanded", "true");
          target.classList.add("open");
        }
      };

      button.addEventListener("click", handleFaqClick);
      cleanups.push(() =>
        button.removeEventListener("click", handleFaqClick)
      );
    });

    function initCarousel(shell: HTMLElement) {
      const trackEl = shell.querySelector<HTMLElement>(".carousel-track");
      const prevButtonEl =
        shell.querySelector<HTMLButtonElement>("[data-carousel-prev]");
      const nextButtonEl =
        shell.querySelector<HTMLButtonElement>("[data-carousel-next]");
      const status = shell.querySelector<HTMLElement>("[data-carousel-status]");

      if (!trackEl || !prevButtonEl || !nextButtonEl) {
        return null;
      }

      const track = trackEl;
      const prevButton = prevButtonEl;
      const nextButton = nextButtonEl;
      const slides = Array.from(track.children) as HTMLElement[];
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
        const slideWidth = slides[0]?.getBoundingClientRect().width || 1;
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

      function scrollToIndex(index: number) {
        const boundedIndex = Math.max(0, Math.min(index, slides.length - 1));
        track.scrollTo({
          left: slides[boundedIndex]?.offsetLeft ?? 0,
          behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        });
      }

      function moveBy(direction: number) {
        const currentIndex = getNearestIndex();
        scrollToIndex(currentIndex + direction);
      }

      const handlePrevClick = () => moveBy(-1);
      const handleNextClick = () => moveBy(1);
      const handleTrackScroll = () => requestUpdate();
      const handleTrackKeydown = (event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveBy(-1);
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          moveBy(1);
        }
      };
      const handlePointerDown = (event: PointerEvent) => {
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
      };
      const handlePointerMove = (event: PointerEvent) => {
        if (!pointerActive) {
          return;
        }

        const delta = event.clientX - startX;
        track.scrollLeft = startScroll - delta;
      };
      const releasePointer = (event?: PointerEvent) => {
        if (!pointerActive) {
          return;
        }

        pointerActive = false;
        track.style.cursor = "";
        if (event && typeof track.releasePointerCapture === "function") {
          try {
            track.releasePointerCapture(event.pointerId);
          } catch {
            // Ignore release failures when the browser already cleared capture.
          }
        }
      };
      const handlePointerUp = (event: PointerEvent) => releasePointer(event);
      const handlePointerCancel = (event: PointerEvent) => releasePointer(event);
      const handlePointerLeave = (event: PointerEvent) => {
        if (event.pointerType === "mouse") {
          releasePointer(event);
        }
      };

      prevButton.addEventListener("click", handlePrevClick);
      nextButton.addEventListener("click", handleNextClick);
      track.addEventListener("scroll", handleTrackScroll, { passive: true });
      track.addEventListener("keydown", handleTrackKeydown);
      track.addEventListener("pointerdown", handlePointerDown);
      track.addEventListener("pointermove", handlePointerMove);
      track.addEventListener("pointerup", handlePointerUp);
      track.addEventListener("pointercancel", handlePointerCancel);
      track.addEventListener("pointerleave", handlePointerLeave);

      updateUI();

      return {
        refresh: updateUI,
        dispose: () => {
          prevButton.removeEventListener("click", handlePrevClick);
          nextButton.removeEventListener("click", handleNextClick);
          track.removeEventListener("scroll", handleTrackScroll);
          track.removeEventListener("keydown", handleTrackKeydown);
          track.removeEventListener("pointerdown", handlePointerDown);
          track.removeEventListener("pointermove", handlePointerMove);
          track.removeEventListener("pointerup", handlePointerUp);
          track.removeEventListener("pointercancel", handlePointerCancel);
          track.removeEventListener("pointerleave", handlePointerLeave);
          if (rafId) {
            window.cancelAnimationFrame(rafId);
          }
        },
      };
    }

    const carouselControllers = carousels
      .map(initCarousel)
      .filter(
        (controller): controller is NonNullable<ReturnType<typeof initCarousel>> =>
          controller !== null
      );

    cleanups.push(() => {
      carouselControllers.forEach((controller) => controller.dispose());
    });

    function handleForm(
      formId: string,
      submitId: string,
      successId: string,
      loadingText: string
    ) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      const submitButton = document.getElementById(
        submitId
      ) as HTMLButtonElement | null;
      const successMessage = document.getElementById(successId);

      if (!form || !submitButton || !successMessage) {
        return;
      }

      const nameInput = form.querySelector<HTMLInputElement>('[name="name"]');
      const phoneInput = form.querySelector<HTMLInputElement>('[name="phone"]');
      const privacyInput =
        form.querySelector<HTMLInputElement>('[name="privacy"]');
      const trackedInputs = [nameInput, phoneInput].filter(
        (input): input is HTMLInputElement => Boolean(input)
      );

      function setInvalidState(input: HTMLInputElement | null, isInvalid: boolean) {
        if (!input) {
          return;
        }

        input.setAttribute("aria-invalid", String(isInvalid));
      }

      const inputCleanups = trackedInputs.map((input) => {
        const handleInput = () => setInvalidState(input, false);
        input.addEventListener("input", handleInput);
        return () => input.removeEventListener("input", handleInput);
      });
      cleanups.push(...inputCleanups);

      const handleSubmit = (event: SubmitEvent) => {
        event.preventDefault();

        const nameValue = nameInput?.value.trim() || "";
        const phoneValue = phoneInput?.value.trim() || "";
        const hasConsent = privacyInput?.checked || false;

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
          privacyInput?.reportValidity();
          return;
        }

        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
        submitButton.textContent = loadingText;

        window.setTimeout(() => {
          form
            .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(
              "input, select, textarea, button"
            )
            .forEach((field) => {
              field.disabled = true;
            });
          submitButton.setAttribute("aria-busy", "false");
          successMessage.classList.add("show");
        }, 350);
      };

      form.addEventListener("submit", handleSubmit);
      cleanups.push(() => form.removeEventListener("submit", handleSubmit));
    }

    handleForm("contactForm", "cf-submit", "cf-success", "Sending request…");

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (window.innerWidth > 860) {
          closeNav();
        }

        carouselControllers.forEach((controller) => controller.refresh());
      }, 120);
    };

    window.addEventListener("resize", handleResize);
    cleanups.push(() => window.removeEventListener("resize", handleResize));

    return () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
