const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const navDropdowns = Array.from(nav.querySelectorAll(".nav-dropdown"));
const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const serviceCarousel = document.querySelector("[data-service-carousel]");
const serviceTrack = document.querySelector("[data-service-track]");
const serviceCards = serviceTrack ? Array.from(serviceTrack.querySelectorAll(".service-card")) : [];
const carouselPrev = document.querySelector("[data-carousel-prev]");
const carouselNext = document.querySelector("[data-carousel-next]");
const carouselDots = document.querySelector("[data-carousel-dots]");
const servicesSection = document.querySelector(".services-section");
const proofBand = document.querySelector(".proof-band");
const proofStats = proofBand ? Array.from(proofBand.querySelectorAll(".stat")) : [];
const revealItems = Array.from(document.querySelectorAll(".reveal")).filter(
  (item) => !item.closest(".services-section")
);
const forceSolidHeader = header.classList.contains("legal-header");

const stageRevealContent = () => {
  revealItems.forEach((item) => {
    const stagedItems = item.querySelectorAll("h2, h3, p, .hero-actions, dl > div, li, label, button, .contact-details a");

    stagedItems.forEach((child, index) => {
      child.classList.add("reveal-item");
      child.style.setProperty("--item-delay", `${Math.min(index * 70, 360)}ms`);
    });
  });

  document.querySelectorAll(".split").forEach((split) => {
    split.querySelectorAll(":scope > .reveal").forEach((item, index) => {
      item.classList.add("reveal-left");
      item.style.setProperty("--reveal-delay", `${index * 180}ms`);
    });
  });

  document.querySelectorAll(".intro-grid").forEach((layout) => {
    const leftPanel = layout.querySelector(":scope > .credential-panel");
    const rightPanel = layout.querySelector(":scope > .section-copy");

    [leftPanel, rightPanel].filter(Boolean).forEach((item, index) => {
      item.classList.add("reveal-left");
      item.style.setProperty("--reveal-delay", `${index * 160}ms`);
    });
  });

  document.querySelectorAll(".sector-grid, .contact-section").forEach((layout) => {
    layout.querySelectorAll(":scope > .reveal, :scope > .sector-panel").forEach((item, index) => {
      item.classList.add("reveal-left");
      item.style.setProperty("--reveal-delay", `${index * 160}ms`);
    });
  });

  document.querySelectorAll(".proof-band, .timeline").forEach((group) => {
    group.querySelectorAll(":scope > .reveal, :scope > .stat, :scope > .timeline-step, :scope > .sector-panel").forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${index * 90}ms`);
    });
  });
};

stageRevealContent();

const setActiveNav = (sectionId) => {
  navLinks.forEach((link) => {
    if (link.classList.contains("page-contact-link") && document.querySelector(".nav-menu a.is-active")) {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
      return;
    }

    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const setHeaderState = () => {
  header.classList.toggle("is-scrolled", forceSolidHeader || window.scrollY > 24);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const closeNavDropdowns = (except) => {
  navDropdowns.forEach((dropdown) => {
    if (dropdown === except) return;
    dropdown.classList.remove("is-open");
    const button = dropdown.querySelector(".nav-menu-button");
    if (button) button.setAttribute("aria-expanded", "false");
  });
};

navDropdowns.forEach((dropdown) => {
  const button = dropdown.querySelector(".nav-menu-button");

  if (!button) return;

  button.addEventListener("click", (event) => {
    event.preventDefault();
    const isOpen = dropdown.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
    closeNavDropdowns(dropdown);
  });
});

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  if (!isOpen) closeNavDropdowns();
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    closeNavDropdowns();
  }
});

document.addEventListener("click", (event) => {
  if (nav.contains(event.target)) return;
  closeNavDropdowns();
});

const navObserver = new IntersectionObserver(
  (entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visibleEntries[0]) {
      setActiveNav(visibleEntries[0].target.id);
    }
  },
  {
    threshold: [0.18, 0.32, 0.5, 0.68],
    rootMargin: "-24% 0px -48% 0px",
  }
);

navSections.forEach((section) => navObserver.observe(section));

if (serviceCarousel && serviceTrack && serviceCards.length) {
  let serviceIndex = 0;
  let carouselTimer;
  let carouselStartTimer;
  let carouselFadeTimer;
  let carouselIsVisible = false;
  let carouselIsPausedByUser = false;
  const canAutoplay = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  const firstCarouselDelay = 2400;
  const carouselInterval = 21200;

  const dots = serviceCards.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show service ${index + 1}`);
    dot.addEventListener("click", () => goToService(index));
    carouselDots.appendChild(dot);
    return dot;
  });

  carouselPrev.innerHTML = "&lsaquo;";
  carouselNext.innerHTML = "&rsaquo;";

  const updateDots = () => {
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === serviceIndex);
    });
  };

  const maxServiceIndex = () => {
    const maxScroll = Math.max(0, serviceTrack.scrollWidth - serviceTrack.clientWidth);

    return serviceCards.reduce((maxIndex, card, index) => {
      const cardLeft = card.offsetLeft - serviceTrack.offsetLeft;
      return cardLeft <= maxScroll + 1 ? index : maxIndex;
    }, 0);
  };

  const updateCarouselControls = () => {
    const maxIndex = maxServiceIndex();
    serviceIndex = Math.min(Math.max(serviceIndex, 0), maxIndex);
    carouselPrev.disabled = serviceIndex <= 0;
    carouselNext.disabled = serviceIndex >= maxIndex;
    updateDots();
  };

  const goToService = (index) => {
    serviceIndex = Math.min(Math.max(index, 0), maxServiceIndex());
    serviceTrack.classList.add("is-transitioning");
    window.clearTimeout(carouselFadeTimer);
    serviceTrack.scrollTo({
      left: serviceCards[serviceIndex].offsetLeft - serviceTrack.offsetLeft,
      behavior: canAutoplay ? "smooth" : "auto",
    });
    carouselFadeTimer = window.setTimeout(() => {
      serviceTrack.classList.remove("is-transitioning");
    }, 1050);
    updateCarouselControls();
  };

  const nearestCardIndex = () => {
    const trackLeft = serviceTrack.getBoundingClientRect().left;
    return serviceCards.reduce((closestIndex, card, index) => {
      const currentDistance = Math.abs(card.getBoundingClientRect().left - trackLeft);
      const closestDistance = Math.abs(serviceCards[closestIndex].getBoundingClientRect().left - trackLeft);
      return currentDistance < closestDistance ? index : closestIndex;
    }, 0);
  };

  const startCarousel = () => {
    if (!canAutoplay || !carouselIsVisible || carouselIsPausedByUser) return;
    stopCarousel();
    carouselStartTimer = window.setTimeout(() => {
      goToService(serviceIndex >= maxServiceIndex() ? 0 : serviceIndex + 1);
      carouselTimer = window.setInterval(() => {
        goToService(serviceIndex >= maxServiceIndex() ? 0 : serviceIndex + 1);
      }, carouselInterval);
    }, firstCarouselDelay);
  };

  const stopCarousel = () => {
    window.clearTimeout(carouselStartTimer);
    window.clearInterval(carouselTimer);
  };

  carouselPrev.addEventListener("click", () => {
    if (!carouselPrev.disabled) goToService(serviceIndex - 1);
  });
  carouselNext.addEventListener("click", () => {
    if (!carouselNext.disabled) goToService(serviceIndex + 1);
  });

  serviceTrack.addEventListener("scroll", () => {
    window.clearTimeout(serviceTrack.scrollTimeout);
    serviceTrack.scrollTimeout = window.setTimeout(() => {
      serviceIndex = nearestCardIndex();
      updateCarouselControls();
    }, 90);
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(serviceTrack.resizeTimeout);
    serviceTrack.resizeTimeout = window.setTimeout(() => {
      goToService(serviceIndex);
    }, 120);
  });

  const pauseCarouselForUser = () => {
    carouselIsPausedByUser = true;
    stopCarousel();
  };

  const resumeCarouselAfterUser = () => {
    carouselIsPausedByUser = false;
    startCarousel();
  };

  servicesSection.querySelectorAll(".service-card, .carousel-button, .carousel-dots button").forEach((item) => {
    item.addEventListener("pointerenter", pauseCarouselForUser);
    item.addEventListener("pointerleave", resumeCarouselAfterUser);
    item.addEventListener("focusin", pauseCarouselForUser);
    item.addEventListener("focusout", resumeCarouselAfterUser);
  });

  updateCarouselControls();

  const carouselVisibilityObserver = new IntersectionObserver(
    ([entry]) => {
      carouselIsVisible = entry.isIntersecting;
      if (entry.isIntersecting) {
        startCarousel();
      } else {
        stopCarousel();
      }
    },
    { threshold: 0.34 }
  );

  carouselVisibilityObserver.observe(serviceCarousel);
}

if (window.gsap && window.ScrollTrigger && servicesSection) {
  gsap.registerPlugin(ScrollTrigger);

  const servicesTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: servicesSection,
      start: "top 58%",
      once: true,
    },
    defaults: {
      ease: "power4.out",
    },
  });

  gsap.set(".service-card, .service-card .line-icon, .service-card h3, .service-card p, .carousel-dots button", {
    opacity: 0,
  });

  servicesTimeline
    .fromTo(
      ".services-head .section-kicker",
      { x: -56, y: 8, opacity: 0 },
      { x: 0, y: 0, opacity: 1, duration: 0.36, clearProps: "transform" },
      0
    )
    .fromTo(
      ".services-head h2",
      { x: -84, y: 14, opacity: 0 },
      { x: 0, y: 0, opacity: 1, duration: 0.54, clearProps: "transform" },
      0.08
    )
    .fromTo(
      ".carousel-controls",
      { x: -42, y: 8, opacity: 0 },
      { x: 0, y: 0, opacity: 1, duration: 0.42, clearProps: "transform" },
      0.28
    )
    .fromTo(
      ".service-card",
      {
        x: -150,
        y: 72,
        rotationY: -18,
        rotationZ: -2,
        scale: 0.86,
        filter: "blur(10px)",
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        filter: "blur(0px)",
        transformOrigin: "50% 50%",
        duration: 1.05,
        stagger: 0.16,
      },
      0.44
    )
    .fromTo(".service-card .line-icon", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, opacity: 1, duration: 0.46, stagger: 0.07 }, 0.84)
    .fromTo(".service-card h3", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.54, stagger: 0.08 }, 0.98)
    .fromTo(".service-card p", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.58, stagger: 0.08 }, 1.14)
    .fromTo(".carousel-dots button", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, opacity: 1, duration: 0.46, stagger: 0.04 }, 1.68);
}

const formatCounter = (value, element) => {
  if (element.dataset.format === "compact") {
    return value >= 1000 ? `${Math.round(value / 1000).toLocaleString()}k` : value.toLocaleString();
  }

  return `${value.toLocaleString()}${element.dataset.suffix || ""}`;
};

const animateCounter = (element, duration = 1500, delay = 0) => {
  if (element.dataset.done) return;
  element.dataset.done = "true";

  const target = Number(element.dataset.count);
  const startedAt = performance.now() + delay;
  element.classList.add("is-counting");

  const tick = (now) => {
    if (now < startedAt) {
      requestAnimationFrame(tick);
      return;
    }

    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = formatCounter(current, element);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.classList.remove("is-counting");
    }
  };

  requestAnimationFrame(tick);
};

const animateProofCounters = () => {
  if (!proofBand || proofBand.dataset.countersDone) return;
  proofBand.dataset.countersDone = "true";

  const counters = Array.from(proofBand.querySelectorAll("[data-count]"));
  const sharedDuration = 1600;

  counters.forEach((counter) => {
    animateCounter(counter, sharedDuration, 0);
  });
};

const animateRevealItem = (item) => {
  item.classList.add("is-visible");
};

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  if (proofBand) {
    gsap.set(proofStats, {
      opacity: 0,
      y: 28,
      filter: "blur(5px)",
    });

    const proofTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: proofBand,
        start: "top 72%",
        once: true,
      },
    });

    proofTimeline
      .to(proofStats, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.62,
        stagger: 0,
        ease: "expo.out",
      })
      .call(animateProofCounters, null, "-=0.36");
  }

  revealItems.forEach((item) => {
    const stagedChildren = item.querySelectorAll(".reveal-item");
    const comesFromLeft = item.classList.contains("reveal-left");
    const comesFromRight = item.classList.contains("reveal-right");
    const startX = comesFromLeft ? -95 : comesFromRight ? 95 : 0;
    const startRotation = comesFromLeft ? -3.5 : comesFromRight ? 3.5 : 0;
    const revealDelay = Number.parseFloat(item.style.getPropertyValue("--reveal-delay")) || 0;

    gsap.set(item, {
      opacity: 0,
      x: startX,
      y: comesFromLeft || comesFromRight ? 0 : 38,
      scale: 0.985,
      rotateZ: startRotation,
      filter: "blur(6px)",
      transformOrigin: "50% 60%",
    });

    if (stagedChildren.length) {
      gsap.set(stagedChildren, {
        opacity: 0,
        y: 18,
        filter: "blur(4px)",
      });
    }

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top 64%",
        once: true,
        onEnter: () => animateRevealItem(item),
      },
      defaults: {
        ease: "expo.out",
      },
    });

    timeline.to(item, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotateZ: 0,
      filter: "blur(0px)",
      duration: 0.72,
    }, revealDelay / 1000);

    if (stagedChildren.length) {
      timeline.to(
        stagedChildren,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.48,
          stagger: 0.055,
        },
        revealDelay / 1000 + 0.16
      );
    }
  });
} else {
  if (proofBand) {
    const proofObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        proofStats.forEach((stat) => stat.classList.add("is-visible"));
        animateProofCounters();
        proofObserver.disconnect();
      },
      { threshold: 0.28 }
    );

    proofObserver.observe(proofBand);
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateRevealItem(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.24,
      rootMargin: "0px 0px -36% 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll(".contact-form").forEach((form) => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  const idleText = button ? button.textContent : "";
  let clearStatusOnScroll;

  const clearStatus = () => {
    if (!status || status.dataset.state === "pending") return;
    status.textContent = "";
    delete status.dataset.state;
    window.removeEventListener("scroll", clearStatusOnScroll);
  };

  clearStatusOnScroll = clearStatus;

  const clearStatusAfterNextScroll = () => {
    window.removeEventListener("scroll", clearStatusOnScroll);
    window.addEventListener("scroll", clearStatusOnScroll, { passive: true, once: true });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (status) {
      status.textContent = "Sending your enquiry...";
      status.dataset.state = "pending";
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Sending...";
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Form submission failed");
      }

      form.reset();

      if (status) {
        status.textContent = "Enquiry sent. Greenline will get back to you shortly.";
        status.dataset.state = "success";
        clearStatusAfterNextScroll();
      }
    } catch (error) {
      if (status) {
        status.textContent = "Something stopped the enquiry sending. Please try again in a moment.";
        status.dataset.state = "error";
        clearStatusAfterNextScroll();
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = idleText;
      }
    }
  });
});
