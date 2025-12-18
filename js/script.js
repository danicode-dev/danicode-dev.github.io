document.addEventListener('DOMContentLoaded', () => {
    initCacheCleanup();
    initThemeToggle();
    initSmoothScrolling();
    initInactivityAutoscroll();
    initNavbar();
    initScrollReveal();
    initProjectsMarquee();

    initTypingAnimation();
    initEmailCopy();
    initParticles();
    initCounters();
    initFooterClock();
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
    const toggleCheckbox = document.getElementById('theme-toggle');
    if (!toggleCheckbox) return;

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

    // Update checkbox state based on theme
    const updateCheckbox = (theme) => {
        const isDark = theme === 'dark';
        toggleCheckbox.checked = isDark;
    };

    const applyTheme = (theme, { persist = true } = {}) => {
        document.documentElement.dataset.theme = theme;

        if (persist) {
            storage.set('theme', theme);
        }

        updateCheckbox(theme);
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    };

    // Initialize theme
    if (!document.documentElement.dataset.theme) {
        const storedTheme = storage.get('theme');
        const theme = storedTheme || (themeQuery.matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = theme;
    }

    updateCheckbox(getTheme());

    // Toggle change handler (checkbox)
    toggleCheckbox.addEventListener('change', () => {
        const next = toggleCheckbox.checked ? 'dark' : 'light';
        applyTheme(next);
    });

    // Sync with system preference
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




function initInactivityAutoscroll() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (window.scrollY > 0) return;
    if (window.location.hash && window.location.hash !== '#home') return;

    const target = document.getElementById('projects');
    if (!target) return;

    const sessionKey = 'autoscroll-featured-projects';
    const session = {
        get(key) {
            try {
                return sessionStorage.getItem(key);
            } catch (error) {
                return null;
            }
        },
        set(key, value) {
            try {
                sessionStorage.setItem(key, value);
            } catch (error) { }
        },
    };

    if (session.get(sessionKey)) return;
    session.set(sessionKey, '1');

    let timeoutId = null;

    const cleanup = () => {
        if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
            timeoutId = null;
        }

        window.removeEventListener('mousemove', cleanup);
        window.removeEventListener('scroll', cleanup);
        window.removeEventListener('wheel', cleanup);
        window.removeEventListener('touchstart', cleanup);
        window.removeEventListener('pointerdown', cleanup);
        document.removeEventListener('keydown', cleanup);
    };

    window.addEventListener('mousemove', cleanup, { passive: true, once: true });
    window.addEventListener('scroll', cleanup, { passive: true, once: true });
    window.addEventListener('wheel', cleanup, { passive: true, once: true });
    window.addEventListener('touchstart', cleanup, { passive: true, once: true });
    window.addEventListener('pointerdown', cleanup, { passive: true, once: true });
    document.addEventListener('keydown', cleanup, { once: true });

    timeoutId = window.setTimeout(() => {
        cleanup();

        if (window.scrollY > 0) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 5000);
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

// ===== Animated Counters =====
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Observer to start animation when visible
    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');

                if (prefersReducedMotion) {
                    counter.textContent = target + '+';
                    observerInstance.unobserve(counter);
                    return;
                }

                // Animation logic
                const duration = 2000; // 2 seconds
                const frameDuration = 1000 / 60; // 60fps
                const totalFrames = Math.round(duration / frameDuration);
                let currentFrame = 0;

                const easeOutQuad = t => t * (2 - t);

                const animate = () => {
                    currentFrame++;
                    const progress = easeOutQuad(currentFrame / totalFrames);
                    const currentCount = Math.round(target * progress);

                    if (currentFrame < totalFrames) {
                        counter.textContent = currentCount + '+';
                        requestAnimationFrame(animate);
                    } else {
                        counter.textContent = target + '+';
                    }
                };

                animate();
                observerInstance.unobserve(counter);
            }
        });
    }, {
        threshold: 0.5 // Start when 50% visible
    });

    counters.forEach(counter => observer.observe(counter));
}

// Footer Clock - Real-time update
function initFooterClock() {
    const timeEl = document.getElementById('footer-time');
    const dateEl = document.getElementById('footer-date');
    if (!timeEl || !dateEl) return;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function getOrdinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');

        timeEl.textContent = `${hours}:${mins}`;
        dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${getOrdinal(now.getDate())}, ${now.getFullYear()}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// Footer Typing Animation
function initFooterTyping() {
    const element = document.getElementById('footer-typing-name');
    const cursor = document.getElementById('footer-cursor');
    if (!element) return;

    const text = 'Daniel García · Aspiring Full-Stack Developer';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        element.textContent = text;
        if (cursor) cursor.style.display = 'none';
        return;
    }

    let hasAnimated = false;
    let charIndex = 0;

    function typeChar() {
        if (charIndex <= text.length) {
            element.textContent = text.substring(0, charIndex);
            charIndex++;
            setTimeout(typeChar, 50);
        } else {
            if (cursor) {
                setTimeout(() => {
                    cursor.style.transition = 'opacity 0.5s ease';
                    cursor.style.opacity = '0';
                }, 1500);
            }
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                setTimeout(typeChar, 300);
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });

    observer.observe(element);
}
