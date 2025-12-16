document.addEventListener('DOMContentLoaded', () => {
    initCacheCleanup();
    initThemeToggle();
    initSmoothScrolling();
    initScrollReveal();
    initTechMarquee();
    initBackgroundCanvas();
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

function initTechMarquee() {
    const marquees = document.querySelectorAll('.tech-marquee');
    if (!marquees.length) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const getGap = (element) => {
        const styles = window.getComputedStyle(element);
        const gapValue = styles.columnGap || styles.gap || '0px';
        const gap = Number.parseFloat(gapValue);
        return Number.isFinite(gap) ? gap : 0;
    };

    const rebuildMarquee = (marquee, track) => {
        track.querySelectorAll('.tech-chip.is-clone').forEach((clone) => clone.remove());
        track.style.removeProperty('--marquee-distance');

        if (reducedMotionQuery.matches) return;

        const originals = Array.from(track.querySelectorAll('.tech-chip:not(.is-clone)'));
        if (!originals.length) return;

        const originalWidth = track.scrollWidth;
        const distance = Math.ceil(originalWidth + getGap(track));

        const appendCloneSet = () => {
            originals.forEach((item) => {
                const clone = item.cloneNode(true);
                clone.classList.add('is-clone');
                clone.setAttribute('aria-hidden', 'true');
                track.appendChild(clone);
            });
        };

        appendCloneSet();
        track.style.setProperty('--marquee-distance', `${distance}px`);

        const neededWidth = distance + marquee.clientWidth + 32;
        while (track.scrollWidth < neededWidth) {
            appendCloneSet();
        }
    };

    const debounced = (fn, waitMs = 150) => {
        let timer = 0;
        return (...args) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => fn(...args), waitMs);
        };
    };

    const instances = Array.from(marquees)
        .map((marquee) => ({ marquee, track: marquee.querySelector('.tech-marquee-track') }))
        .filter(({ track }) => Boolean(track));

    if (!instances.length) return;

    const rebuildAll = () => {
        instances.forEach(({ marquee, track }) => rebuildMarquee(marquee, track));
    };

    const rebuildAllDebounced = debounced(rebuildAll, 150);
    window.addEventListener('resize', rebuildAllDebounced);

    if (typeof reducedMotionQuery.addEventListener === 'function') {
        reducedMotionQuery.addEventListener('change', rebuildAll);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
        reducedMotionQuery.addListener(rebuildAll);
    }

    rebuildAll();
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

function initBackgroundCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let colors = getCanvasColors();

    const onThemeChange = () => {
        colors = getCanvasColors();
    };

    window.addEventListener('themechange', onThemeChange);

    const config = {
        maxDpr: 2,
        density: 14000,
        maxParticles: 160,
        particleRadiusMin: 0.6,
        particleRadiusMax: 1.8,
        speed: 0.35,
        linkDistance: 140,
        mouseLinkDistance: 160,
        mouseIdleMs: 1000,
    };

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrameId = 0;
    let isRunning = false;

    const mouse = {
        x: 0,
        y: 0,
        lastMove: 0,
    };

    const randomBetween = (min, max) => Math.random() * (max - min) + min;

    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;

        const dpr = Math.min(window.devicePixelRatio || 1, config.maxDpr);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const targetCount = Math.min(
            config.maxParticles,
            Math.max(40, Math.floor((width * height) / config.density))
        );
        particles = Array.from({ length: targetCount }, () => ({
            x: randomBetween(0, width),
            y: randomBetween(0, height),
            radius: randomBetween(config.particleRadiusMin, config.particleRadiusMax),
            alpha: randomBetween(0.2, 0.9),
            vx: randomBetween(-config.speed, config.speed),
            vy: randomBetween(-config.speed, config.speed),
        }));
    };

    const update = () => {
        for (const particle of particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < -10) particle.x = width + 10;
            if (particle.x > width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = height + 10;
            if (particle.y > height + 10) particle.y = -10;
        }
    };

    const drawParticles = () => {
        for (const particle of particles) {
            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fillStyle = rgba(colors.primary, particle.alpha);
            context.fill();
        }
    };

    const drawLinks = () => {
        const linkDistance2 = config.linkDistance * config.linkDistance;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance2 = dx * dx + dy * dy;
                if (distance2 > linkDistance2) continue;

                const opacity = (1 - distance2 / linkDistance2) * 0.18;
                context.strokeStyle = rgba(colors.secondary, opacity);
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(particles[i].x, particles[i].y);
                context.lineTo(particles[j].x, particles[j].y);
                context.stroke();
            }
        }
    };

    const drawMouseLinks = () => {
        const now = performance.now();
        if (now - mouse.lastMove > config.mouseIdleMs) return;

        const mouseDistance2 = config.mouseLinkDistance * config.mouseLinkDistance;

        for (const particle of particles) {
            const dx = particle.x - mouse.x;
            const dy = particle.y - mouse.y;
            const distance2 = dx * dx + dy * dy;
            if (distance2 > mouseDistance2) continue;

            const opacity = (1 - distance2 / mouseDistance2) * 0.35;
            context.strokeStyle = rgba(colors.primary, opacity);
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(mouse.x, mouse.y);
            context.stroke();
        }
    };

    const render = () => {
        context.clearRect(0, 0, width, height);
        context.globalCompositeOperation = 'lighter';
        drawLinks();
        drawMouseLinks();
        drawParticles();
        context.globalCompositeOperation = 'source-over';
    };

    const frame = () => {
        if (!isRunning) return;
        update();
        render();
        animationFrameId = window.requestAnimationFrame(frame);
    };

    const start = () => {
        if (isRunning) return;
        isRunning = true;
        animationFrameId = window.requestAnimationFrame(frame);
    };

    const stop = () => {
        if (!isRunning) return;
        window.cancelAnimationFrame(animationFrameId);
        isRunning = false;
    };

    const onPointerMove = (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.lastMove = performance.now();
    };

    const onVisibilityChange = () => {
        if (document.hidden) return stop();
        start();
    };

    let resizeTimer = 0;
    const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            resize();
        }, 150);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    resize();
    start();
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


// ===== Typing Animation (Single Write) =====
function initTypingAnimation() {
    const element = document.getElementById('typing-text');
    if (!element) return;

    const phrase = 'Full Stack Developer';
    let charIndex = 0;

    function type() {
        if (charIndex <= phrase.length) {
            element.textContent = phrase.substring(0, charIndex);
            charIndex++;
            setTimeout(type, 100);
        } else {
            // Hide cursor after typing complete
            const cursor = document.querySelector('.typing-cursor');
            if (cursor) {
                setTimeout(() => { cursor.style.opacity = '0'; }, 1000);
            }
        }
    }

    setTimeout(type, 500);
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
