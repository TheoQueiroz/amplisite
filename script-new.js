/* ============================================
   AMPLI BY FUZZR - ENTERING THE TUNNEL
   Dynamic curved path through scenes
   ============================================ */

class AmpliExperience {
    constructor() {
        this.scenes = document.querySelectorAll('.scene-3d');
        this.totalScenes = this.scenes.length;
        this.currentScene = 0;
        this.progress = 0;
        this.targetProgress = 0;
        this.isSnapped = true; // Start snapped
        this.snapTimer = null;
        this.sceneSpacing = 800;
        
        // Scenes positioned along Z axis (tunnel effect)
        this.scenePositions = [];
        for (let i = 0; i < this.totalScenes; i++) {
            this.scenePositions.push({
                z: -i * this.sceneSpacing
            });
        }
        
        this.init();
    }
    
    init() {
        this.initLoader();
    }
    
    initLoader() {
        const loader = document.querySelector('.loader');
        const progress = document.querySelector('.loader-progress');
        
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 10 + 3;
            if (width >= 100) {
                width = 100;
                clearInterval(interval);
                setTimeout(() => {
                    loader.classList.add('hidden');
                    document.body.classList.add('loaded');
                    this.start();
                }, 500);
            }
            progress.style.width = width + '%';
        }, 35);
    }
    
    start() {
        this.initCursor();
        this.initScrollControl();
        this.initNavigation();
        this.init3DBackground();
        this.initWaveforms();
        this.initRegionalizationDemo();
        this.initBatchDemo();
        this.initClientsTunnel();
        this.positionScenes();
        this.animate();
    }
    
    // Position scenes along Z axis (tunnel)
    positionScenes() {
        this.scenes.forEach((scene, i) => {
            const z = this.scenePositions[i].z;
            scene.style.transform = `translate3d(0, 0, ${z}px)`;
        });
        this.scenes[0].classList.add('active');
        this.scenes[0].classList.add('entering');
    }
    
    // Scroll control with snap
    initScrollControl() {
        // Wheel - scroll to move, then snap
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            this.isSnapped = false;
            clearTimeout(this.snapTimer);
            
            const delta = e.deltaY * 0.001;
            this.targetProgress += delta;
            this.targetProgress = Math.max(0, Math.min(1, this.targetProgress));
            
            // Auto-snap after scroll stops
            this.snapTimer = setTimeout(() => this.snapToScene(), 150);
            
        }, { passive: false });
        
        // Touch
        let lastY = 0;
        
        window.addEventListener('touchstart', (e) => {
            lastY = e.touches[0].clientY;
            this.isSnapped = false;
            clearTimeout(this.snapTimer);
        }, { passive: true });
        
        window.addEventListener('touchmove', (e) => {
            const y = e.touches[0].clientY;
            const delta = (lastY - y) * 0.004;
            this.targetProgress += delta;
            this.targetProgress = Math.max(0, Math.min(1, this.targetProgress));
            lastY = y;
        }, { passive: true });
        
        window.addEventListener('touchend', () => {
            this.snapTimer = setTimeout(() => this.snapToScene(), 100);
        });
        
        // Keyboard - direct scene navigation
        window.addEventListener('keydown', (e) => {
            if (['ArrowDown', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
                this.goToScene(this.currentScene + 1);
            } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
                e.preventDefault();
                this.goToScene(this.currentScene - 1);
            }
        });
    }
    
    snapToScene() {
        const nearestScene = Math.round(this.targetProgress * (this.totalScenes - 1));
        this.targetProgress = nearestScene / (this.totalScenes - 1);
        this.isSnapped = true;
    }
    
    initNavigation() {
        document.querySelectorAll('[data-scene]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = parseInt(btn.getAttribute('data-scene'));
                this.goToScene(target);
            });
        });
    }
    
    goToScene(index) {
        if (index < 0 || index >= this.totalScenes) return;
        this.targetProgress = index / (this.totalScenes - 1);
        this.isSnapped = true;
    }
    
    animate() {
        const diff = this.targetProgress - this.progress;
        
        // Faster interpolation when snapped, slower when scrolling
        const speed = this.isSnapped ? 0.12 : 0.08;
        this.progress += diff * speed;
        this.progress = Math.max(0, Math.min(1, this.progress));
        
        // Lock to target when very close and snapped
        if (this.isSnapped && Math.abs(diff) < 0.002) {
            this.progress = this.targetProgress;
        }
        
        // Calculate camera Z position (moves forward through tunnel)
        const cameraZ = this.progress * this.sceneSpacing * (this.totalScenes - 1);
        
        // Current scene detection
        const prevScene = this.currentScene;
        this.currentScene = Math.round(this.progress * (this.totalScenes - 1));
        
        // Scene changed - trigger entrance animation
        if (prevScene !== this.currentScene) {
            this.animateSceneEntrance(this.currentScene);
        }
        
        // Update each scene position relative to camera
        this.scenes.forEach((scene, i) => {
            const panel = scene.querySelector('.scene-panel');
            const sceneZ = this.scenePositions[i].z;
            
            // Distance from camera (positive = ahead, negative = behind)
            const relZ = sceneZ + cameraZ;
            
            // Scale and opacity based on distance
            const dist = Math.abs(relZ);
            
            // When snapped and this is active scene, lock in place
            const isActiveScene = i === this.currentScene;
            const isLocked = this.isSnapped && isActiveScene && Math.abs(diff) < 0.01;
            
            let scale, opacity, finalZ;
            
            if (isLocked) {
                // Locked: perfectly centered
                scale = 1;
                opacity = 1;
                finalZ = 0;
            } else {
                // Moving: calculate based on distance
                const maxDist = this.sceneSpacing;
                const normalizedDist = Math.min(dist / maxDist, 1.5);
                scale = Math.max(0.5, 1 - normalizedDist * 0.4);
                opacity = Math.max(0, 1 - normalizedDist * 0.8);
                finalZ = relZ;
            }
            
            // Apply transform - scenes come from front (negative Z = in front)
            scene.style.transform = `translate3d(0, 0, ${finalZ}px) scale(${scale})`;
            panel.style.opacity = opacity;
            
            // Active state
            scene.classList.toggle('active', isActiveScene && opacity > 0.5);
        });
        
        // Update UI
        this.updateUI();
        
        // Expose to 3D background
        window.journeyProgress = this.progress;
        
        requestAnimationFrame(() => this.animate());
    }
    
    animateSceneEntrance(sceneIndex) {
        // Remove entering from all scenes
        this.scenes.forEach(s => s.classList.remove('entering'));
        
        const scene = this.scenes[sceneIndex];
        if (!scene) return;
        
        // Add entrance class
        void scene.offsetWidth;
        scene.classList.add('entering');
        
        // Remove after animation
        setTimeout(() => scene.classList.remove('entering'), 1000);
    }
    
    updateUI() {
        // Progress
        const bar = document.querySelector('.journey-progress');
        if (bar) bar.style.height = (this.progress * 100) + '%';
        
        // Dots
        document.querySelectorAll('.journey-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentScene);
        });
        
        // Nav
        document.querySelectorAll('.nav-link').forEach((link) => {
            const scene = parseInt(link.getAttribute('data-scene'));
            link.classList.toggle('active', scene === this.currentScene);
        });
        
        // Header
        document.querySelector('.header')?.classList.toggle('scrolled', this.progress > 0.05);
        
        // Scroll hint
        document.querySelector('.scroll-indicator')?.classList.toggle('hidden', this.progress > 0.08);
        
        // Final scene - used para transição de logo (header -> logo central)
        const isFinalScene = this.currentScene === this.totalScenes - 1;
        const body = document.body;
        const alreadyFinal = body.classList.contains('final-active');

        // Entrou na cena final agora
        if (isFinalScene && !alreadyFinal) {
            const headerLogo = document.querySelector('.logo img');
            const finalLogo = document.querySelector('.final-logo');
            if (headerLogo && finalLogo) {
                const hRect = headerLogo.getBoundingClientRect();
                const fRect = finalLogo.getBoundingClientRect();

                const hCenterX = hRect.left + hRect.width / 2;
                const hCenterY = hRect.top + hRect.height / 2;
                const fCenterX = fRect.left + fRect.width / 2;
                const fCenterY = fRect.top + fRect.height / 2;

                const translateX = fCenterX - hCenterX;
                const translateY = fCenterY - hCenterY;
                const scale = hRect.height > 0 ? (fRect.height / hRect.height) : 1.4;

                document.documentElement.style.setProperty('--logo-final-translate-x', `${translateX}px`);
                document.documentElement.style.setProperty('--logo-final-translate-y', `${translateY}px`);
                document.documentElement.style.setProperty('--logo-final-scale', `${scale}`);
            }
        }

        body.classList.toggle('final-active', !!isFinalScene);
    }
    
    // Cursor
    initCursor() {
        const dot = document.querySelector('.cursor-dot');
        const ring = document.querySelector('.cursor-ring');
        if (!dot || !ring || window.innerWidth < 1025) return;
        
        let mx = 0, my = 0, dx = 0, dy = 0, rx = 0, ry = 0;
        
        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        
        const anim = () => {
            dx += (mx - dx) * 0.35;
            dy += (my - dy) * 0.35;
            rx += (mx - rx) * 0.18;
            ry += (my - ry) * 0.18;
            dot.style.left = dx + 'px';
            dot.style.top = dy + 'px';
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            requestAnimationFrame(anim);
        };
        anim();
        
        document.querySelectorAll('a, button, .client, .feature, .demo-player').forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('hover'));
            el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
        });
    }
    
    // 3D Background - Beautiful wave grid + particles
    init3DBackground() {
        const container = document.getElementById('canvas-container');
        if (!container || typeof THREE === 'undefined') return;
        
        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1500);
            camera.position.set(0, 80, 350);
            camera.lookAt(0, 0, 0);
            
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);
            
            // ============ WAVE GRID ============
            const gridSize = 80;
            const gridGeo = new THREE.PlaneGeometry(800, 800, gridSize, gridSize);
            const gridMat = new THREE.MeshBasicMaterial({
                color: 0xFF5E00,
                wireframe: true,
                transparent: true,
                opacity: 0.12
            });
            const grid = new THREE.Mesh(gridGeo, gridMat);
            grid.rotation.x = -Math.PI / 2.2;
            grid.position.y = -50;
            grid.position.z = -100;
            scene.add(grid);
            
            const gridOriginal = gridGeo.attributes.position.array.slice();
            
            // ============ FEWER GLOW PARTICLES ============
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            grad.addColorStop(0, 'rgba(255,120,50,1)');
            grad.addColorStop(0.3, 'rgba(255,94,0,0.5)');
            grad.addColorStop(0.6, 'rgba(255,94,0,0.15)');
            grad.addColorStop(1, 'rgba(255,94,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            const tex = new THREE.CanvasTexture(canvas);
            
            const pCount = 30; // Reduced from 100
            const pGeo = new THREE.BufferGeometry();
            const pPos = new Float32Array(pCount * 3);
            const pData = [];
            
            for (let i = 0; i < pCount; i++) {
                pPos[i * 3] = (Math.random() - 0.5) * 800;
                pPos[i * 3 + 1] = Math.random() * 250 - 80;
                pPos[i * 3 + 2] = (Math.random() - 0.5) * 600 - 150;
                pData.push({
                    baseY: pPos[i * 3 + 1],
                    speed: 0.3 + Math.random() * 0.5,
                    phase: Math.random() * Math.PI * 2,
                    drift: (Math.random() - 0.5) * 0.15
                });
            }
            
            pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
            
            const pMat = new THREE.PointsMaterial({
                size: 5,
                map: tex,
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const particles = new THREE.Points(pGeo, pMat);
            scene.add(particles);
            
            // ============ FLOATING ORBS (fewer) ============
            const orbs = [];
            for (let i = 0; i < 4; i++) { // Reduced from 8
                const orbGeo = new THREE.SphereGeometry(4 + Math.random() * 4, 10, 10);
                const orbMat = new THREE.MeshBasicMaterial({
                    color: 0xFF5E00,
                    transparent: true,
                    opacity: 0.1 + Math.random() * 0.1
                });
                const orb = new THREE.Mesh(orbGeo, orbMat);
                orb.position.set(
                    (Math.random() - 0.5) * 600,
                    Math.random() * 180 - 50,
                    (Math.random() - 0.5) * 500 - 150
                );
                orb.userData = {
                    baseY: orb.position.y,
                    speed: 0.2 + Math.random() * 0.3,
                    phase: Math.random() * Math.PI * 2
                };
                orbs.push(orb);
                scene.add(orb);
            }
            
            // ============ ACCENT LINES (fewer) ============
            const lineGroup = new THREE.Group();
            for (let i = 0; i < 3; i++) { // Reduced from 6
                const points = [];
                const startX = (Math.random() - 0.5) * 700;
                const startZ = -400 - Math.random() * 200;
                for (let j = 0; j < 15; j++) {
                    points.push(new THREE.Vector3(
                        startX + j * 35,
                        Math.sin(j * 0.4) * 25 + 60,
                        startZ + j * 20
                    ));
                }
                const curve = new THREE.CatmullRomCurve3(points);
                const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
                const lineMat = new THREE.LineBasicMaterial({
                    color: 0xFF5E00,
                    transparent: true,
                    opacity: 0.05 + Math.random() * 0.05
                });
                const line = new THREE.Line(lineGeo, lineMat);
                lineGroup.add(line);
            }
            scene.add(lineGroup);
            
            // Mouse tracking
            let mx = 0, my = 0, tmx = 0, tmy = 0;
            document.addEventListener('mousemove', e => {
                tmx = (e.clientX / window.innerWidth - 0.5) * 2;
                tmy = (e.clientY / window.innerHeight - 0.5) * 2;
            });
            
            let time = 0;
            
            // Caminho curvo da câmera - AGRESSIVO, como se caminhasse
            const cameraPath = [
                { x: 0, y: 120, z: 400, lookX: 0, lookY: 0, lookZ: 0 },         // Hero - alto, olhando pra frente
                { x: -200, y: -50, z: 250, lookX: 100, lookY: 50, lookZ: -100 }, // Demo - desce forte, vira esquerda
                { x: 150, y: 180, z: 150, lookX: -100, lookY: -80, lookZ: 0 },  // Features - sobe direita, olha baixo
                { x: -120, y: -30, z: 80, lookX: 80, lookY: 100, lookZ: -50 },  // Clients - desce esquerda, olha cima
                { x: 0, y: 60, z: 30, lookX: 0, lookY: 0, lookZ: -100 }         // Contact - centraliza
            ];
            
            // Interpola suavemente entre pontos do caminho
            const getPathPoint = (progress) => {
                const totalPoints = cameraPath.length - 1;
                const p = progress * totalPoints;
                const i = Math.floor(p);
                const t = p - i;
                
                const p1 = cameraPath[Math.min(i, totalPoints)];
                const p2 = cameraPath[Math.min(i + 1, totalPoints)];
                
                // Smooth interpolation (ease in-out)
                const smooth = t * t * (3 - 2 * t);
                
                return {
                    x: p1.x + (p2.x - p1.x) * smooth,
                    y: p1.y + (p2.y - p1.y) * smooth,
                    z: p1.z + (p2.z - p1.z) * smooth,
                    lookX: p1.lookX + (p2.lookX - p1.lookX) * smooth,
                    lookY: p1.lookY + (p2.lookY - p1.lookY) * smooth,
                    lookZ: p1.lookZ + (p2.lookZ - p1.lookZ) * smooth
                };
            };
            
            // Posição atual da câmera (para suavização)
            let camX = 0, camY = 80, camZ = 350;
            let lookX = 0, lookY = 0, lookZ = -100;
            
            // Light spots background
            const lightSpots = document.querySelector('.light-spots');
            let currentSpotScene = 1;
            
            const animate = () => {
                time += 0.015;
                const progress = window.journeyProgress || 0;
                
                // Smooth mouse
                mx += (tmx - mx) * 0.04;
                my += (tmy - my) * 0.04;
                
                // Pega ponto do caminho curvo
                const pathPoint = getPathPoint(progress);
                
                // Suaviza movimento da câmera
                camX += (pathPoint.x + mx * 40 - camX) * 0.03;
                camY += (pathPoint.y - my * 20 - camY) * 0.03;
                camZ += (pathPoint.z - camZ) * 0.03;
                lookX += (pathPoint.lookX - lookX) * 0.03;
                lookY += (pathPoint.lookY - lookY) * 0.03;
                lookZ += (pathPoint.lookZ - lookZ) * 0.03;
                
                camera.position.set(camX, camY, camZ);
                camera.lookAt(lookX, lookY, lookZ);
                
                // Update light spots scene (1-5)
                const spotScene = Math.min(Math.round(progress * 4) + 1, 5);
                if (lightSpots && spotScene !== currentSpotScene) {
                    currentSpotScene = spotScene;
                    lightSpots.setAttribute('data-active-spots', spotScene);
                }
                
                // Transparent renderer to show CSS gradient
                renderer.setClearColor(0x000000, 0);
                
                // Animate wave grid - intensidade muda por cena
                const waveIntensity = 1 + Math.sin(progress * Math.PI) * 0.5;
                const gPos = gridGeo.attributes.position.array;
                for (let i = 0; i < gPos.length; i += 3) {
                    const ox = gridOriginal[i];
                    const oy = gridOriginal[i + 1];
                    const wave1 = Math.sin(ox * 0.02 + time) * 15 * waveIntensity;
                    const wave2 = Math.sin(oy * 0.015 + time * 0.7) * 10 * waveIntensity;
                    const wave3 = Math.sin((ox + oy) * 0.01 + time * 1.2) * 8;
                    gPos[i + 2] = wave1 + wave2 + wave3;
                }
                gridGeo.attributes.position.needsUpdate = true;
                
                // Grid mantém cor laranja
                gridMat.opacity = 0.1 + Math.sin(progress * Math.PI) * 0.08;
                grid.rotation.z = Math.sin(time * 0.1) * 0.02 + progress * 0.1;
                
                // Animate particles
                const positions = pGeo.attributes.position.array;
                for (let i = 0; i < pCount; i++) {
                    const d = pData[i];
                    positions[i * 3] += d.drift;
                    positions[i * 3 + 1] = d.baseY + Math.sin(time * d.speed + d.phase) * 20;
                    
                    if (positions[i * 3] > 350) positions[i * 3] = -350;
                    if (positions[i * 3] < -350) positions[i * 3] = 350;
                }
                pGeo.attributes.position.needsUpdate = true;
                pMat.opacity = 0.6 + Math.sin(time * 0.5) * 0.2;
                
                // Orbs flutuam
                orbs.forEach((orb, i) => {
                    const d = orb.userData;
                    const floatSpeed = 1 + progress * 0.5;
                    orb.position.y = d.baseY + Math.sin(time * d.speed * floatSpeed + d.phase) * 25;
                    orb.rotation.y += 0.01 + progress * 0.01;
                    orb.rotation.x += 0.005;
                    orb.material.opacity = 0.12 + Math.sin(time + i) * 0.08;
                });
                
                // Lines
                lineGroup.children.forEach((line, i) => {
                    line.material.opacity = 0.06 + Math.sin(time * 0.3 + i) * 0.04;
                });
                lineGroup.rotation.y = Math.sin(time * 0.2) * 0.05 + progress * 0.15;
                
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
            };
            animate();
            
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
        } catch (e) {
            console.log('3D:', e);
        }
    }
    
    initRegionalizationDemo() {
        const demo = document.querySelector('.regional-demo');
        if (!demo) return;
        
        const button = demo.querySelector('.regionalize-btn');
        const cards = demo.querySelectorAll('.regional-card');
        
        if (!button || cards.length === 0) return;
        
        const audioByRegion = {
            sul: document.getElementById('regional-audio-sul'),
            sudeste: document.getElementById('regional-audio-sudeste'),
            nordeste: document.getElementById('regional-audio-nordeste')
        };
        
        let generating = false;
        let ready = false;
        let currentAudio = null;
        let currentCard = null;
        let timerTimeout = null;
        
        const stopCurrentAudio = () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            if (currentCard) {
                currentCard.classList.remove('playing');
            }
            currentAudio = null;
            currentCard = null;
        };
        
        // Quando áudio termina, remover estado playing
        Object.values(audioByRegion).forEach(audio => {
            if (audio) {
                audio.addEventListener('ended', () => {
                    if (currentCard) {
                        currentCard.classList.remove('playing');
                    }
                    currentAudio = null;
                    currentCard = null;
                });
            }
        });
        
        button.addEventListener('click', () => {
            if (generating) return;
            
            generating = true;
            ready = false;
            demo.classList.remove('ready');
            demo.classList.add('generating');
            stopCurrentAudio();
            
            if (timerTimeout) clearTimeout(timerTimeout);
            timerTimeout = setTimeout(() => {
                generating = false;
                ready = true;
                demo.classList.remove('generating');
                demo.classList.add('ready');
            }, 1600);
        });
        
        cards.forEach((card) => {
            card.addEventListener('click', () => {
                if (!ready) return;
                
                const region = card.getAttribute('data-region');
                const audio = region ? audioByRegion[region] : null;
                if (!audio) return;
                
                // Se já está tocando este card, atua como PAUSE/STOP
                if (currentCard === card && card.classList.contains('playing')) {
                    stopCurrentAudio();
                    return;
                }

                // Trocar para outro card / iniciar reprodução
                stopCurrentAudio();
                
                currentAudio = audio;
                currentCard = card;
                card.classList.add('playing');
                
                try {
                    audio.currentTime = 0;
                    audio.play();
                } catch (e) {
                    console.log('Audio play error:', e);
                }
            });
        });
    }
    
    // Batch generation demo - Sheet to Audio
    initBatchDemo() {
        const demo = document.querySelector('.batch-demo');
        if (!demo) return;
        
        const button = demo.querySelector('.batch-btn');
        const sheetRows = demo.querySelectorAll('.sheet-row[data-row]');
        const audioCards = demo.querySelectorAll('.batch-audio[data-row]');
        
        if (!button || sheetRows.length === 0) return;
        
        const audioByRow = {
            1: document.getElementById('batch-audio-1'),
            2: document.getElementById('batch-audio-2'),
            3: document.getElementById('batch-audio-3'),
            4: document.getElementById('batch-audio-4'),
            5: document.getElementById('batch-audio-5')
        };

        let generating = false;
        let ready = false;
        let currentAudio = null;
        let currentCard = null;

        const stopCurrent = () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            if (currentCard) {
                currentCard.classList.remove('playing');
            }
            currentAudio = null;
            currentCard = null;
        };

        Object.values(audioByRow).forEach(audio => {
            if (audio) {
                audio.addEventListener('ended', () => {
                    if (currentCard) {
                        currentCard.classList.remove('playing');
                    }
                    currentAudio = null;
                    currentCard = null;
                });
            }
        });
        
        button.addEventListener('click', () => {
            if (generating) return;
            
            generating = true;
            ready = false;
            demo.classList.remove('ready');
            demo.classList.add('generating');
            
            // Animate each row being "processed" one by one
            let rowIndex = 0;
            const processRow = () => {
                if (rowIndex > 0) {
                    sheetRows[rowIndex - 1].classList.remove('processing');
                }
                
                if (rowIndex < sheetRows.length) {
                    sheetRows[rowIndex].classList.add('processing');
                    rowIndex++;
                    setTimeout(processRow, 350);
                } else {
                    // All rows processed
                    setTimeout(() => {
                        generating = false;
                        ready = true;
                        demo.classList.remove('generating');
                        demo.classList.add('ready');
                    }, 200);
                }
            };
            
            setTimeout(processRow, 300);
        });

        audioCards.forEach((card) => {
            const playButton = card.querySelector('.batch-audio-play');
            const target = playButton || card;
            
            target.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!ready) return;
                
                const row = card.getAttribute('data-row');
                const audio = row ? audioByRow[row] : null;
                if (!audio) return;
                
                if (currentCard === card && card.classList.contains('playing')) {
                    stopCurrent();
                    return;
                }
                
                stopCurrent();
                currentCard = card;
                currentAudio = audio;
                card.classList.add('playing');
                
                try {
                    audio.currentTime = 0;
                    audio.play();
                } catch (e) {
                    console.log('Audio play error:', e);
                }
            });
        });
    }
    
    // Client cards spotlight animation - cycles through each card
    initClientsTunnel() {
        const cards = document.querySelectorAll('.client-card');
        if (cards.length === 0) return;
        
        let currentIndex = 0;
        
        // Cycle spotlight through cards
        const cycleSpotlight = () => {
            // Remove spotlight from all
            cards.forEach(card => card.classList.remove('spotlight'));
            
            // Add to current
            cards[currentIndex].classList.add('spotlight');
            
            // Next card
            currentIndex = (currentIndex + 1) % cards.length;
        };
        
        // Start cycling every 2 seconds
        cycleSpotlight();
        setInterval(cycleSpotlight, 2000);
    }
    
    // Waveforms - impressive animated visualizer
    initWaveforms() {
        const oldWave = document.getElementById('wave-old');
        const newWave = document.getElementById('wave-new');
        if (oldWave) this.createWave(oldWave, false);
        if (newWave) this.createWave(newWave, true);
    }
    
    createWave(container, isFeatured) {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            // use logical coordinates; we'll scale via setTransform on each draw
        };
        resize();
        window.addEventListener('resize', resize);
        
        // Standard equalizer-style bars
        const barCount = 28;
        const bars = Array.from({ length: barCount }, () => ({
            level: 0.2,
            target: 0.2,
            speed: 0.08 + Math.random() * 0.06
        }));
        
        const updateBars = () => {
            bars.forEach((bar, i) => {
                if (isFeatured) {
                    // More dynamic movement for Ampli by Fuzzr
                    if (Math.random() < 0.1) {
                        bar.target = 0.2 + Math.random() * 0.8;
                    }
                } else {
                    // Discrete, lower levels for traditional
                    if (Math.random() < 0.05) {
                        bar.target = 0.1 + Math.random() * 0.4;
                    }
                }
                
                bar.level += (bar.target - bar.level) * bar.speed;
            });
        };
        
        const draw = () => {
            const w = canvas.width / dpr;
            const h = canvas.height / dpr;
            
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            
            updateBars();
            
            const barWidth = (w / barCount) * 0.6;
            const gap = (w / barCount) * 0.4;
            const minHeight = 4;
            
            bars.forEach((bar, i) => {
                const level = Math.max(0.05, Math.min(1, bar.level));
                const height = Math.max(minHeight, level * h * 0.8);
                const x = i * (barWidth + gap) + gap / 2;
                const y = (h - height) / 2;
                
                if (isFeatured) {
                    const gradient = ctx.createLinearGradient(x, y, x, y + height);
                    gradient.addColorStop(0, '#FF9A5C');
                    gradient.addColorStop(0.5, '#FF5E00');
                    gradient.addColorStop(1, '#CC4A00');
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = '#555';
                }
                
                const radius = Math.min(6, barWidth / 2);
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, height, radius);
                ctx.fill();
            });
            
            if (isFeatured) {
                requestAnimationFrame(draw);
            }
        };
        
        draw();
        if (!isFeatured) {
            setInterval(draw, 140);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new AmpliExperience());
