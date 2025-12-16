document.addEventListener('DOMContentLoaded', () => {
    initCacheCleanup();
    initThemeToggle();
    initSmoothScrolling();
    initSmoothScrolling();
    initNavbar();
    initScrollReveal();
    initProjectsMenu();
    initContactForm();
    initTypingAnimation();
    initDownloadCV();
    initEmailCopy();
    initParticles();
});

function initCacheCleanup() {
    if (!('serviceWorker' in navigator)) return;

    const basePath = window.location.pathname.replace(/[^/]*$/, '');

    navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
            registrations.forEach((registration) => {
                const scopePath = new URL(registration.scope).pathname;
                if (basePath.startsWith(scopePath)) {
                    registration.unregister();
                }
            });
        })
        .catch(() => { });
}

function initThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storage = {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                return null;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (error) { }
        },
    };

    const getTheme = () => document.documentElement.dataset.theme || 'dark';

    const updateButton = (theme) => {
        const isDark = theme === 'dark';
        const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

        toggleButton.setAttribute('aria-label', label);
        toggleButton.setAttribute('title', label);
        toggleButton.setAttribute('aria-pressed', String(isDark));
        toggleButton.innerHTML = isDark
            ? '<i class="fas fa-sun" aria-hidden="true"></i>'
            : '<i class="fas fa-moon" aria-hidden="true"></i>';
    };

    const applyTheme = (theme, { persist } = { persist: true }) => {
        document.documentElement.dataset.theme = theme;

        if (persist) {
            storage.set('theme', theme);
        }

        updateButton(theme);
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    };

    if (!document.documentElement.dataset.theme) {
        const storedTheme = storage.get('theme');
        const theme = storedTheme || (themeQuery.matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = theme;
    }

    updateButton(getTheme());

    toggleButton.addEventListener('click', () => {
        const next = getTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });

    const syncWithSystem = () => {
        if (storage.get('theme')) return;
        applyTheme(themeQuery.matches ? 'dark' : 'light', { persist: false });
    };

    if (typeof themeQuery.addEventListener === 'function') {
        themeQuery.addEventListener('change', syncWithSystem);
    } else if (typeof themeQuery.addListener === 'function') {
        themeQuery.addListener(syncWithSystem);
    }
}




function initNavbar() {
    const header = document.querySelector('header');
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // Sticky + Shrink Header
    const handleScroll = () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Init check

    // Scrollspy for Active Pill
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Active when section is in middle of viewport
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active from all
                links.forEach(link => link.classList.remove('active'));

                // Add active to corresponding link
                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

function initProjectsMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const dropdown = document.getElementById('projects-dropdown');

    if (!hamburgerBtn || !dropdown) return;

    // Toggle menu on button click
    hamburgerBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = dropdown.classList.toggle('show');
        hamburgerBtn.classList.toggle('active', isOpen);
        hamburgerBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target) && !hamburgerBtn.contains(event.target)) {
            dropdown.classList.remove('show');
            hamburgerBtn.classList.remove('active');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            hamburgerBtn.classList.remove('active');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            hamburgerBtn.focus();
        }
    });
}

function initSmoothScrolling() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior });
        });
    });
}

function initScrollReveal() {
    const targets = document.querySelectorAll('.project-card, .section-title');
    if (!targets.length) return;

    targets.forEach((element) => element.classList.add('reveal', 'is-visible'));

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        return;
    }

    const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const observer = new IntersectionObserver(
        (entries, observerInstance) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observerInstance.unobserve(entry.target);
            });
        },
        { threshold: 0.1 }
    );

    targets.forEach((element) => observer.observe(element));

    window.requestAnimationFrame(() => {
        targets.forEach((element) => {
            if (isInViewport(element)) {
                observer.unobserve(element);
                return;
            }
            element.classList.remove('is-visible');
        });
    });
}



function getCanvasColors() {
    const styles = window.getComputedStyle(document.documentElement);
    const primaryHex = styles.getPropertyValue('--primary-color').trim() || '#38bdf8';
    const secondaryHex = styles.getPropertyValue('--secondary-color').trim() || '#818cf8';

    return {
        primary: hexToRgb(primaryHex) ?? { r: 56, g: 189, b: 248 },
        secondary: hexToRgb(secondaryHex) ?? { r: 129, g: 140, b: 248 },
    };
}

function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function hexToRgb(hex) {
    const value = hex.replace('#', '').trim();
    if (![3, 6].includes(value.length)) return null;

    const expanded = value.length === 3
        ? value.split('').map((char) => char + char).join('')
        : value;

    const number = Number.parseInt(expanded, 16);
    if (Number.isNaN(number)) return null;

    return {
        r: (number >> 16) & 255,
        g: (number >> 8) & 255,
        b: number & 255,
    };
}


// ===== Contact Form with Mailto =====
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const CONTACT_EMAIL = 'webdaniel2025@gmail.com';

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');
    const submitBtn = form.querySelector('.btn-submit');
    const successMessage = form.querySelector('.form-success');

    // Validation patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Clear error on input
    const clearError = (input) => {
        input.classList.remove('error');
        const errorSpan = input.parentElement.querySelector('.form-error');
        if (errorSpan) errorSpan.textContent = '';
    };

    // Show error
    const showError = (input, message) => {
        input.classList.add('error');
        const errorSpan = input.parentElement.querySelector('.form-error');
        if (errorSpan) errorSpan.textContent = message;
    };

    // Validate form
    const validateForm = () => {
        let isValid = true;

        // Name validation
        if (!nameInput.value.trim()) {
            showError(nameInput, 'El nombre es requerido');
            isValid = false;
        } else {
            clearError(nameInput);
        }

        // Email validation
        if (!emailInput.value.trim()) {
            showError(emailInput, 'El email es requerido');
            isValid = false;
        } else if (!emailPattern.test(emailInput.value.trim())) {
            showError(emailInput, 'Email no válido');
            isValid = false;
        } else {
            clearError(emailInput);
        }

        // Message validation
        if (!messageInput.value.trim()) {
            showError(messageInput, 'El mensaje es requerido');
            isValid = false;
        } else {
            clearError(messageInput);
        }

        return isValid;
    };

    // Clear errors on input
    [nameInput, emailInput, messageInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => clearError(input));
        }
    });

    // Form submit handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Build mailto URL
        const name = encodeURIComponent(nameInput.value.trim());
        const email = encodeURIComponent(emailInput.value.trim());
        const message = encodeURIComponent(messageInput.value.trim());

        const subject = encodeURIComponent(`Contacto desde Portfolio: ${nameInput.value.trim()}`);
        const body = encodeURIComponent(
            `Nombre: ${nameInput.value.trim()}\n` +
            `Email: ${emailInput.value.trim()}\n\n` +
            `Mensaje:\n${messageInput.value.trim()}`
        );

        const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

        // Open mailto
        window.location.href = mailtoUrl;

        // Show success message
        if (successMessage) {
            successMessage.classList.add('show');
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 4000);
        }

        // Reset form after short delay
        setTimeout(() => {
            form.reset();
        }, 500);
    });
}


// ===== Typing Animation for Name =====
function initTypingAnimation() {
    const element = document.getElementById('typing-name');
    const cursor = document.getElementById('name-cursor');
    if (!element) return;

    // Get text from data attribute
    const text = element.dataset.text || 'Daniel García';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Show text immediately without animation
        element.textContent = text;
        if (cursor) {
            cursor.style.display = 'none';
        }
        return;
    }

    // Typing animation config
    const config = {
        charDelay: 55,         // ms per character (elegant speed)
        startDelay: 400,       // ms before starting
        cursorFadeDelay: 1500  // ms after typing to fade cursor
    };

    let charIndex = 0;

    function typeChar() {
        if (charIndex <= text.length) {
            element.textContent = text.substring(0, charIndex);
            charIndex++;
            setTimeout(typeChar, config.charDelay);
        } else {
            // Typing complete - fade out cursor
            if (cursor) {
                setTimeout(() => {
                    cursor.style.transition = 'opacity 0.5s ease';
                    cursor.style.opacity = '0';
                }, config.cursorFadeDelay);
            }
        }
    }

    // Start typing after initial delay
    setTimeout(typeChar, config.startDelay);
}

// ===== Download CV =====
function initDownloadCV() {
    const btn = document.getElementById('download-cv');
    if (!btn) return;

    // Button will work once you add assets/cv.pdf
    // For now it just opens the link normally
}

// ===== Copy Email to Clipboard =====
function initEmailCopy() {
    const emailButtons = document.querySelectorAll('.copy-email-btn');

    emailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = btn.dataset.email || 'webdaniel2025@gmail.com';

            navigator.clipboard.writeText(email).then(() => {
                // Show feedback
                btn.classList.add('copied');

                // For contact section button with feedback span
                const feedback = btn.querySelector('.copy-feedback');
                if (feedback) {
                    feedback.classList.add('show');
                    setTimeout(() => {
                        feedback.classList.remove('show');
                        btn.classList.remove('copied');
                    }, 2000);
                } else {
                    // For header icon button - show tooltip
                    btn.setAttribute('title', '¡Copiado!');
                    setTimeout(() => {
                        btn.setAttribute('title', 'Copiar email');
                        btn.classList.remove('copied');
                    }, 2000);
                }
            }).catch(() => {
                // Fallback: open mailto
                window.location.href = 'mailto:' + email;
            });
        });
    });
}


// ===== Constellation Particles =====
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    const colors = ['#58A6FF', '#00D9FF', '#A371F7', '#3FB950'];

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = Math.random() * 0.5 + 0.3;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around edges
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;

            // Mouse interaction
            if (mouse.x !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    this.x -= dx * force * 0.02;
                    this.y -= dy * force * 0.02;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function init() {
        particles = [];
        const count = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function connectParticles() {
        const maxDist = 120;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const opacity = 1 - (dist / maxDist);
                    ctx.beginPath();
                    ctx.strokeStyle = particles[i].color;
                    ctx.globalAlpha = opacity * 0.15;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        connectParticles();
        requestAnimationFrame(animate);
    }

    // Mouse events
    canvas.parentElement.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.parentElement.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Initialize
    resize();
    init();
    animate();

    window.addEventListener('resize', () => {
        resize();
        init();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initProjectsMarquee();
});

function initProjectsMarquee() {
    const marquee = document.querySelector('[data-projects-marquee]');
    if (!marquee) return;

    const track = marquee.querySelector('[data-projects-track]');
    const group = marquee.querySelector('[data-projects-group]');
    if (!track || !group) return;

    const cards = group.querySelectorAll('.project-card');
    if (cards.length < 2) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const coarsePointerQuery = window.matchMedia('(hover: none) and (pointer: coarse)');

    const cloneSelector = '[data-marquee-clone="true"]';
    const pxPerSecond = 30;
    let resizeObserver = null;
    let rafId = 0;
    let hasWindowResizeListener = false;

    const handleWindowResize = () => {
        setMarqueeVars();
    };

    const setMarqueeVars = () => {
        cancelAnimationFrame(rafId);

        rafId = window.requestAnimationFrame(() => {
            const distance = Math.ceil(group.getBoundingClientRect().width);
            if (!distance) return;

            track.style.setProperty('--projects-marquee-distance', `${distance}px`);
            track.style.setProperty('--projects-marquee-duration', `${(distance / pxPerSecond).toFixed(2)}s`);
        });
    };

    const buildCloneGroup = () => {
        const clone = group.cloneNode(true);
        clone.dataset.marqueeClone = 'true';
        clone.setAttribute('aria-hidden', 'true');

        clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
        clone.querySelectorAll('a, button, input, textarea, select, [tabindex]').forEach((node) => {
            node.setAttribute('tabindex', '-1');
        });

        return clone;
    };

    const teardown = () => {
        marquee.classList.remove('projects-marquee--animate');
        track.style.removeProperty('--projects-marquee-distance');
        track.style.removeProperty('--projects-marquee-duration');

        track.querySelectorAll(cloneSelector).forEach((node) => node.remove());

        if (resizeObserver) {
            resizeObserver.disconnect();
        }

        if (hasWindowResizeListener) {
            window.removeEventListener('resize', handleWindowResize);
            hasWindowResizeListener = false;
        }

        cancelAnimationFrame(rafId);
    };

    const setup = () => {
        teardown();

        const shouldAnimate = !reducedMotionQuery.matches && !mobileQuery.matches && !coarsePointerQuery.matches;
        if (!shouldAnimate) return;

        if (!track.querySelector(cloneSelector)) {
            track.appendChild(buildCloneGroup());
        }

        marquee.classList.add('projects-marquee--animate');
        setMarqueeVars();

        if ('ResizeObserver' in window) {
            resizeObserver = resizeObserver || new ResizeObserver(() => setMarqueeVars());
            resizeObserver.disconnect();
            resizeObserver.observe(group);
        } else if (!hasWindowResizeListener) {
            window.addEventListener('resize', handleWindowResize, { passive: true });
            hasWindowResizeListener = true;
        }
    };

    setup();

    const handleMediaChange = () => {
        setup();
    };

    [reducedMotionQuery, mobileQuery, coarsePointerQuery].forEach((query) => {
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', handleMediaChange);
        } else if (typeof query.addListener === 'function') {
            query.addListener(handleMediaChange);
        }
    });
}
