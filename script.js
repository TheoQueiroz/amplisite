// ================================================
// AMPLI BY FUZZR - Awwwards Level Landing Page
// ================================================

// Custom Cursor
const initCursor = () => {
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    
    if (!cursor || !follower) return;
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .floating-card');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => follower.classList.add('hovering'));
        el.addEventListener('mouseleave', () => follower.classList.remove('hovering'));
    });
    
    const animate = () => {
        // Smooth cursor movement
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;
        
        cursor.style.transform = `translate(${cursorX - 4}px, ${cursorY - 4}px)`;
        follower.style.transform = `translate(${followerX - 20}px, ${followerY - 20}px)`;
        
        requestAnimationFrame(animate);
    };
    
    animate();
    
    // Hide on mobile
    if ('ontouchstart' in window) {
        cursor.style.display = 'none';
        follower.style.display = 'none';
        document.body.style.cursor = 'auto';
    }
};

// WebGL Background with floating particles
const initWebGLBackground = () => {
    const canvas = document.getElementById('webgl-background');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create particles
    const particlesCount = 150;
    const positions = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);
    
    for (let i = 0; i < particlesCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 150;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 150;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
        sizes[i] = Math.random() * 0.5 + 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 0.2,
        color: 0xff5e00,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Create connecting lines
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0xff5e00,
        transparent: true,
        opacity: 0.05
    });

    let mouseX = 0, mouseY = 0;
    let scrollY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        
        const time = clock.getElapsedTime();
        
        // Rotate based on mouse
        particles.rotation.y = mouseX * 0.3;
        particles.rotation.x = mouseY * 0.2;
        
        // Animate particles
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < particlesCount; i++) {
            pos[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.01;
        }
        geometry.attributes.position.needsUpdate = true;
        
        // Parallax with scroll
        camera.position.y = -scrollY * 0.02;
        
        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// Counter Animation for Metrics
const animateMetrics = () => {
    const metrics = document.querySelectorAll('.metric-value');
    
    const animateValue = (el) => {
        const target = parseInt(el.dataset.value);
        const duration = 2000;
        const start = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOut * target);
            
            el.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    metrics.forEach(metric => observer.observe(metric));
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initCursor();
    initWebGLBackground();
    animateMetrics();

    // Header scroll effect
    const header = document.querySelector('.header');
    
    const updateHeader = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    // Scroll reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Apply reveal animations to sections
    document.querySelectorAll('.section-header, .feature-card, .audio-card, .testimonial-card').forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(i % 3) * 0.1}s`;
        revealObserver.observe(el);
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const headerOffset = 100;
                const position = target.offsetTop - headerOffset;
                
                window.scrollTo({
                    top: position,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Audio player functionality
    let currentPlaying = null;
    document.querySelectorAll('.play-btn').forEach(button => {
        button.addEventListener('click', function() {
            const isPlaying = this.textContent === '⏸';
            
            if (currentPlaying && currentPlaying !== this) {
                currentPlaying.textContent = '▶';
            }
            
            this.textContent = isPlaying ? '▶' : '⏸';
            currentPlaying = isPlaying ? null : this;
        });
    });
});

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
