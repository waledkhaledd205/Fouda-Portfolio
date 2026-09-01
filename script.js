/**
 * AHMED FOUDA - GIS & SURVEYING SPECIALIST PORTFOLIO
 * Vanilla JavaScript (No Frameworks, No Libraries)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. DOM Elements Cache
  // ==========================================================================
  const htmlEl = document.documentElement;
  const navbar = document.getElementById('navbar');
  const themeToggle = document.getElementById('themeToggle');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const canvas = document.getElementById('topoCanvas');
  const contactForm = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');
  const toastIcon = document.getElementById('toastIcon');
  const currentYearSpan = document.getElementById('currentYear');

  // Modals
  const projectModal = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDoneBtn = document.getElementById('modalDoneBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalDescription = document.getElementById('modalDescription');
  const modalTags = document.getElementById('modalTags');

  const cvModal = document.getElementById('cvModal');
  const cvModalCloseBtn = document.getElementById('cvModalCloseBtn');
  const cvModalCloseBtn2 = document.getElementById('cvModalCloseBtn2');
  const printCvBtn = document.getElementById('printCvBtn');
  const cvTriggers = document.querySelectorAll('.cv-trigger-btn, .cv-download-btn, #heroCvBtn, #contactCvBtn');

  // Update Year in Footer
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // ==========================================================================
  // 2. Dark / Light Theme Management
  // ==========================================================================
  const THEME_KEY = 'ahmed_fouda_theme_pref';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'dark'); // Default dark
    }
  }

  function setTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (typeof updateCanvasThemeColors === 'function') {
      updateCanvasThemeColors();
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      showToast(newTheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled', 'info');
    });
  }

  // ==========================================================================
  // 3. Mobile Navigation Menu
  // ==========================================================================
  function toggleMobileMenu() {
    const isOpen = navMenu.classList.contains('open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function openMobileMenu() {
    navMenu.classList.add('open');
    mobileMenuBtn.classList.add('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    navMenu.classList.remove('open');
    mobileMenuBtn.classList.remove('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });
  }

  // Close menu on link click
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (navMenu && navMenu.classList.contains('open')) {
      if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        closeMobileMenu();
      }
    }
  });

  // ==========================================================================
  // 4. Sticky Navbar & ScrollSpy Active Links
  // ==========================================================================
  function handleScroll() {
    const scrollY = window.scrollY;

    // Sticky nav elevation
    if (scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // ScrollSpy active link detection
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ==========================================================================
  // 5. Scroll Reveal Animation (Intersection Observer)
  // ==========================================================================
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          threshold: 0.12,
          rootMargin: '0px 0px -40px 0px',
        }
      );

      reveals.forEach((el) => revealObserver.observe(el));
    } else {
      // Fallback for legacy browsers
      reveals.forEach((el) => el.classList.add('active'));
    }
  }

  // ==========================================================================
  // 6. Topographic Contour Background Canvas Engine
  // ==========================================================================
  let ctx = null;
  let width = 0;
  let height = 0;
  let animationFrameId = null;
  let time = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let strokePrimary = 'rgba(56, 189, 248, 0.18)';
  let strokeSecondary = 'rgba(16, 185, 129, 0.12)';

  function updateCanvasThemeColors() {
    const isDark = htmlEl.getAttribute('data-theme') === 'dark';
    if (isDark) {
      strokePrimary = 'rgba(56, 189, 248, 0.15)';
      strokeSecondary = 'rgba(16, 185, 129, 0.10)';
    } else {
      strokePrimary = 'rgba(2, 132, 199, 0.14)';
      strokeSecondary = 'rgba(5, 150, 105, 0.08)';
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function drawContourLines() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Smooth mouse interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    time += 0.003;

    const lineCount = 7;
    const spacing = height / (lineCount + 1);

    ctx.lineWidth = 1.2;

    for (let i = 1; i <= lineCount; i++) {
      ctx.beginPath();
      ctx.strokeStyle = i % 2 === 0 ? strokePrimary : strokeSecondary;

      const baseElevation = i * spacing;
      const waveFreq = 0.0018 + i * 0.0003;
      const waveAmp = 35 + i * 6;

      for (let x = 0; x <= width; x += 20) {
        // Distance from mouse to create geographic elevation contour distortion
        const dx = x - mouseX;
        const dy = baseElevation - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseEffect = Math.max(0, 1 - dist / 350) * 30;

        const y =
          baseElevation +
          Math.sin(x * waveFreq + time + i) * waveAmp +
          Math.cos(x * 0.003 - time * 0.8) * 15 -
          mouseEffect;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    animationFrameId = requestAnimationFrame(drawContourLines);
  }

  function initTopoCanvas() {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    updateCanvasThemeColors();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, { passive: true });

    window.addEventListener(
      'mousemove',
      (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
      },
      { passive: true }
    );

    drawContourLines();
  }

  // ==========================================================================
  // 7. Project Details Modal Data & Handlers
  // ==========================================================================
  const projectDatabase = {
    1: {
      category: 'Academic Project',
      title: 'GIS Academic Project',
      description:
        'A comprehensive spatial study developed during university studies at Mansoura University. Focused on geographic data analysis, layer integration, topographic map production, and geographic coordinate alignment.',
      tags: ['GIS Software', 'Data Analysis', 'Cartography', 'Geographic Data Utilization'],
    },
    2: {
      category: 'Applied System',
      title: 'GIS-Based Application',
      description:
        'Contributed to university projects developing practical GIS-based applications. Designed spatial workflows to organize, query, and visualize geographic information, attributes, and thematic spatial boundaries.',
      tags: ['GIS Application', 'Geographic Data', 'Spatial Analysis', 'Data Management'],
    },
    3: {
      category: 'Research Project',
      title: 'Geographic Data Analysis',
      description:
        'An in-depth spatial research project investigating regional geographic patterns and spatial distributions. Included dataset synthesis, attribute normalization, and analysis utilizing Microsoft Excel and GIS data structures.',
      tags: ['Data Analysis', 'Microsoft Excel', 'Spatial Correlations', 'Geographic Data'],
    },
    4: {
      category: 'Cartography & Survey',
      title: 'Mapping & Cartography Project',
      description:
        'Detailed cartographic project focused on precision map layouts, coordinate referencing, topographic contour line representation, and correlating field surveying measurements with digital map layers.',
      tags: ['Surveying', 'Cartography', 'Topographic Mapping', 'Leveling Data'],
    },
  };

  function openProjectModal(projectId) {
    const data = projectDatabase[projectId];
    if (!data || !projectModal) return;

    modalCategory.textContent = data.category;
    modalTitle.textContent = data.title;
    modalDescription.textContent = data.description;

    modalTags.innerHTML = '';
    data.tags.forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = tag;
      modalTags.appendChild(tagEl);
    });

    projectModal.classList.add('open');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('open');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-detail-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-project');
      openProjectModal(pid);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProjectModal);
  if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeProjectModal);
  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) closeProjectModal();
    });
  }

  // ==========================================================================
  // 8. CV Modal & Print Trigger
  // ==========================================================================
  function openCvModal() {
    if (!cvModal) return;
    cvModal.classList.add('open');
    cvModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCvModal() {
    if (!cvModal) return;
    cvModal.classList.remove('open');
    cvModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  cvTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCvModal();
    });
  });

  if (cvModalCloseBtn) cvModalCloseBtn.addEventListener('click', closeCvModal);
  if (cvModalCloseBtn2) cvModalCloseBtn2.addEventListener('click', closeCvModal);
  if (cvModal) {
    cvModal.addEventListener('click', (e) => {
      if (e.target === cvModal) closeCvModal();
    });
  }

  if (printCvBtn) {
    printCvBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Global Escape key listener for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeCvModal();
    }
  });

  // ==========================================================================
  // 9. Contact Form Validation & Toast Notification
  // ==========================================================================
  function showToast(message, type = 'success') {
    if (!toast) return;

    toastText.textContent = message;

    if (type === 'success') {
      toastIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
      toastIcon.style.color = 'var(--color-accent-green)';
    } else {
      toastIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`;
      toastIcon.style.color = 'var(--color-primary)';
    }

    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  if (contactForm) {
    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');
    const messageInput = document.getElementById('userMessage');
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const messageError = document.getElementById('messageError');
    const submitBtn = document.getElementById('submitBtn');

    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      // Reset errors
      nameError.textContent = '';
      emailError.textContent = '';
      messageError.textContent = '';
      nameInput.classList.remove('invalid');
      emailInput.classList.remove('invalid');
      messageInput.classList.remove('invalid');

      // Validate Name
      if (!nameInput.value.trim()) {
        nameError.textContent = 'Please enter your full name.';
        nameInput.classList.add('invalid');
        isValid = false;
      }

      // Validate Email
      if (!emailInput.value.trim()) {
        emailError.textContent = 'Please enter your email address.';
        emailInput.classList.add('invalid');
        isValid = false;
      } else if (!validateEmail(emailInput.value.trim())) {
        emailError.textContent = 'Please enter a valid email address.';
        emailInput.classList.add('invalid');
        isValid = false;
      }

      // Validate Message
      if (!messageInput.value.trim()) {
        messageError.textContent = 'Please enter your message.';
        messageInput.classList.add('invalid');
        isValid = false;
      } else if (messageInput.value.trim().length < 10) {
        messageError.textContent = 'Message should be at least 10 characters.';
        messageInput.classList.add('invalid');
        isValid = false;
      }

      if (isValid) {
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = `
          <svg class="hud-pulse" style="width:14px;height:14px;"></svg>
          <span>Sending Message...</span>
        `;
        submitBtn.disabled = true;

        setTimeout(() => {
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
          showToast(`Thank you, ${nameInput.value.trim()}! Your message has been sent successfully.`, 'success');
          contactForm.reset();
        }, 1000);
      }
    });
  }

  // ==========================================================================
  // 10. Initialization
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initScrollReveal();
    initTopoCanvas();
    handleScroll();
  });
})();