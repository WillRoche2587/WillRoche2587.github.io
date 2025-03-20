// Three.js Scene Setup
let scene, camera, renderer, particles, particleLayers = [], lines;
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

// Initialize Three.js scene
function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#hero-canvas'),
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create multiple particle layers
    createParticleLayers();
    
    // Create particle connections
    createParticleConnections();

    // Position camera further back to see more of the scene
    camera.position.z = 5;

    // Event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
}

function createParticleLayers() {
    // Adjust the spread based on screen aspect ratio
    const aspectRatio = window.innerWidth / window.innerHeight;
    const spreadX = Math.max(20 * aspectRatio, 20); // Increased spread
    const spreadY = Math.max(20, 20); // Separate Y spread

    // Layer 1 - Far background, more particles, smaller size
    const layer1 = createParticleLayer(3000, 6, 0.003, spreadX, spreadY);
    layer1.position.z = -2;
    particleLayers.push(layer1);
    scene.add(layer1);

    // Layer 2 - Middle layer, medium count and size
    const layer2 = createParticleLayer(2000, 4, 0.005, spreadX, spreadY);
    layer2.position.z = 0;
    particleLayers.push(layer2);
    scene.add(layer2);

    // Layer 3 - Foreground, fewer particles, larger size
    const layer3 = createParticleLayer(1000, 2, 0.007, spreadX, spreadY);
    layer3.position.z = 2;
    particleLayers.push(layer3);
    scene.add(layer3);
}

function createParticleLayer(count, depth, size, spreadX, spreadY) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        // Random position across entire viewport
        positions[i] = (Math.random() - 0.5) * spreadX;     // X
        positions[i + 1] = (Math.random() - 0.5) * spreadY; // Y
        positions[i + 2] = (Math.random() - 0.5) * depth;   // Z

        // Add random velocities for movement
        velocities[i] = (Math.random() - 0.5) * 0.02;     // X velocity
        velocities[i + 1] = (Math.random() - 0.5) * 0.02; // Y velocity
        velocities[i + 2] = (Math.random() - 0.5) * 0.01; // Z velocity
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        size: size,
        color: '#C0C0C0',
        transparent: true,
        opacity: 0.6
    });

    return new THREE.Points(geometry, material);
}

function createParticleConnections() {
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3000 * 3); // Preallocate space for lines
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const linesMaterial = new THREE.LineBasicMaterial({
        color: '#8A92B2',
        transparent: true,
        opacity: 0.15
    });
    
    lines = new THREE.LineSegments(lineGeometry, linesMaterial);
    scene.add(lines);
}

function updateParticleConnections() {
    if (!lines || particleLayers.length === 0) return;

    const positions = lines.geometry.attributes.position.array;
    const particles = particleLayers[1].geometry.attributes.position.array;
    let connectionIndex = 0;
    
    // Track number of connections per particle
    const connectionCounts = new Array(particles.length / 3).fill(0);

    for (let i = 0; i < particles.length; i += 3) {
        const x1 = particles[i];
        const y1 = particles[i + 1];
        const z1 = particles[i + 2];
        const particleIndex1 = i / 3;

        // Skip if this particle already has max connections
        if (connectionCounts[particleIndex1] >= 5) continue;

        for (let j = i + 3; j < particles.length; j += 3) {
            if (connectionIndex >= positions.length - 6) break;
            
            const particleIndex2 = j / 3;
            if (connectionCounts[particleIndex2] >= 5) continue;

            const x2 = particles[j];
            const y2 = particles[j + 1];
            const z2 = particles[j + 2];

            // Calculate distance between particles
            const distance = Math.sqrt(
                Math.pow(x2 - x1, 2) +
                Math.pow(y2 - y1, 2) +
                Math.pow(z2 - z1, 2)
            );

            // Connect if particles are close enough
            if (distance < 2) {
                positions[connectionIndex] = x1;
                positions[connectionIndex + 1] = y1;
                positions[connectionIndex + 2] = z1;
                positions[connectionIndex + 3] = x2;
                positions[connectionIndex + 4] = y2;
                positions[connectionIndex + 5] = z2;
                connectionIndex += 6;

                connectionCounts[particleIndex1]++;
                connectionCounts[particleIndex2]++;

                if (connectionCounts[particleIndex1] >= 5) break;
            }
        }
    }

    // Clear any unused connections
    for (let i = connectionIndex; i < positions.length; i++) {
        positions[i] = 0;
    }

    lines.geometry.attributes.position.needsUpdate = true;
}

// Mouse move handler with adjusted sensitivity
function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 200;  // Reduced sensitivity
    mouseY = (event.clientY - window.innerHeight / 2) / 200;
}

// Enhanced window resize handler
function onWindowResize() {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Recreate particles with new aspect ratio
    particleLayers.forEach(layer => {
        scene.remove(layer);
    });
    particleLayers = [];
    
    if(lines) {
        scene.remove(lines);
    }
    
    createParticleLayers();
    createParticleConnections();
}

// Animation loop with particle movement
function animate() {
    requestAnimationFrame(animate);

    // Smoother camera movement
    targetX = mouseX * 0.4;
    targetY = mouseY * 0.4;
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;

    // Update particle positions with velocities
    particleLayers.forEach((layer, index) => {
        const positions = layer.geometry.attributes.position.array;
        const velocities = layer.geometry.attributes.velocity.array;
        const spread = index === 0 ? 20 : index === 1 ? 15 : 10;

        for (let i = 0; i < positions.length; i += 3) {
            // Update positions based on velocities
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

            // Wrap particles around when they go out of bounds
            if (positions[i] > spread) positions[i] = -spread;
            if (positions[i] < -spread) positions[i] = spread;
            if (positions[i + 1] > spread) positions[i + 1] = -spread;
            if (positions[i + 1] < -spread) positions[i + 1] = spread;
            if (positions[i + 2] > spread) positions[i + 2] = -spread;
            if (positions[i + 2] < -spread) positions[i + 2] = spread;
        }

        layer.geometry.attributes.position.needsUpdate = true;
        layer.rotation.x += 0.0003 * (index + 1);
        layer.rotation.y += 0.0003 * (index + 1);
    });

    // Update dynamic connections
    updateParticleConnections();

    renderer.render(scene, camera);
}

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Loading screen
window.addEventListener('load', () => {
    const loadingScreen = document.querySelector('.loading-screen');
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
});

// Form submission handling
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Show success message
            const successMessage = document.getElementById('successMessage');
            successMessage.style.display = 'block';
            
            // Clear form
            form.reset();
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Initialize everything
init();
animate();