/**
 * The Sylvana Restaurant (দ্যা সিলভানা রেস্টুরেন্ট)
 * Immersive 3D Dining Presentation & WebGL Scene Engine
 */

(function () {
  'use strict';

  // State Management
  const state = {
    content: null,
    selectedCategory: 'All Dishes',
    featuredDish: null,
    activeModelType: 'biryani',
    scrollY: 0,
    scrollProgress: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    tableRotationY: 0,
    targetTableRotationY: 0,
    clocheLift: 0, // 0 = resting, 1 = fully lifted
    soundEnabled: false,
    audioCtx: null
  };

  // DOM Cache
  const dom = {
    canvas: document.getElementById('webgl-canvas'),
    container: document.getElementById('webgl-canvas-container'),
    hudText: document.getElementById('hudText'),
    resetCamBtn: document.getElementById('resetCamBtn'),
    inspectBtn: document.getElementById('inspectBtn'),
    heroInspectBtn: document.getElementById('heroInspectBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    categoryFilterStrip: document.getElementById('categoryFilterStrip'),
    menuGrid: document.getElementById('menuGrid'),
    spotlightIcon: document.getElementById('spotlightIcon'),
    spotlightDishName: document.getElementById('spotlightDishName'),
    spotlightDishPrice: document.getElementById('spotlightDishPrice'),
    spotlightLabel: document.getElementById('spotlightLabel'),
    // Dynamic text targets
    heroHeadline: document.getElementById('heroHeadline'),
    heroBnTitle: document.getElementById('heroBnTitle'),
    heroSubtitle: document.getElementById('heroSubtitle'),
    heroMetaHours: document.getElementById('heroMetaHours'),
    heroMetaAddress: document.getElementById('heroMetaAddress'),
    heritageStory1: document.getElementById('heritageStory1'),
    heritageStory2: document.getElementById('heritageStory2'),
    heritageMetricItems: document.getElementById('heritageMetricItems'),
    infoAddress: document.getElementById('infoAddress'),
    infoHours: document.getElementById('infoHours'),
    infoPhone: document.getElementById('infoPhone'),
    infoEmail: document.getElementById('infoEmail')
  };

  /* ==========================================================================
     Three.js WebGL Scene Initialization
     ========================================================================== */
  let scene, camera, renderer;
  let tableGroup, clocheMesh, dishGroup;
  let steamParticles, ambientParticles;
  let candleLight1, candleLight2, topSpotLight;
  let clock;
  let dishes3D = {};

  function initThree() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js is not loaded. Falling back to CSS 3D presentation.');
      return;
    }

    clock = new THREE.Clock();

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0907, 0.04);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    camera.position.set(0, 4.2, 8.8);
    camera.lookAt(0, 0.6, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: dom.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2d1e15, 1.4);
    scene.add(ambientLight);

    // Candle point lights with flickers
    candleLight1 = new THREE.PointLight(0xff9d3b, 2.4, 12, 1.5);
    candleLight1.position.set(-2.8, 1.6, 1.2);
    scene.add(candleLight1);

    candleLight2 = new THREE.PointLight(0xf59e0b, 1.8, 10, 1.5);
    candleLight2.position.set(2.8, 1.4, -0.8);
    scene.add(candleLight2);

    // Warm overhead restaurant spotlight
    topSpotLight = new THREE.SpotLight(0xfff1dc, 3.2, 16, Math.PI / 4, 0.4, 1.2);
    topSpotLight.position.set(0, 7.5, 2.5);
    topSpotLight.target.position.set(0, 0.5, 0);
    scene.add(topSpotLight);
    scene.add(topSpotLight.target);

    // Subtle side rim light (crimson/amber tone)
    const rimLight = new THREE.DirectionalLight(0xe63917, 0.85);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Build 3D Dining Table Setting
    buildDiningSetting();

    // Build Floating Spice & Candle Ember Particles
    buildAtmosphereParticles();

    // Bind Event Listeners
    setupInteractions();

    // Start Animation Loop
    animate();
  }

  /* ==========================================================================
     3D Dining Table & Procedural Culinary Models
     ========================================================================== */
  function buildDiningSetting() {
    tableGroup = new THREE.Group();
    scene.add(tableGroup);

    // 1. Dining Table Pedestal (Polished Dark Mahogany)
    const tableGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.45, 64);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x16100c,
      roughness: 0.35,
      metalness: 0.15
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.y = -0.22;
    tableGroup.add(tableMesh);

    // Brass inlay trim ring around table
    const trimGeo = new THREE.TorusGeometry(3.55, 0.035, 16, 64);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.rotation.x = Math.PI / 2;
    trimMesh.position.y = 0.01;
    tableGroup.add(trimMesh);

    // 2. Porcelain Dining Plate with Golden Rim
    const plateGeo = new THREE.CylinderGeometry(1.65, 1.45, 0.12, 48);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.15,
      metalness: 0.05
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = 0.06;
    tableGroup.add(plateMesh);

    // Golden Plate Rim
    const plateRimGeo = new THREE.TorusGeometry(1.65, 0.03, 16, 48);
    const goldRimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9
    });
    const plateRimMesh = new THREE.Mesh(plateRimGeo, goldRimMat);
    plateRimMesh.rotation.x = Math.PI / 2;
    plateRimMesh.position.y = 0.12;
    tableGroup.add(plateRimMesh);

    // Candle holders on table sides
    buildCandleHolder(-2.8, 0.0, 1.2);
    buildCandleHolder(2.8, 0.0, -0.8);

    // 3. Procedural Dishes Group
    dishGroup = new THREE.Group();
    dishGroup.position.y = 0.12;
    tableGroup.add(dishGroup);

    buildDishModels();

    // 4. Luxury Polished Cloche (Food Bell Dome)
    const clocheGroup = new THREE.Group();
    clocheGroup.position.y = 0.12;

    const domeGeo = new THREE.SphereGeometry(1.58, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const clocheMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.18,
      metalness: 0.92
    });
    const domeMesh = new THREE.Mesh(domeGeo, clocheMat);
    clocheGroup.add(domeMesh);

    // Cloche Rim Ring
    const clocheRimGeo = new THREE.TorusGeometry(1.58, 0.04, 16, 48);
    const clocheRimMesh = new THREE.Mesh(clocheRimGeo, goldRimMat);
    clocheRimMesh.rotation.x = Math.PI / 2;
    clocheGroup.add(clocheRimMesh);

    // Cloche Handle Knob
    const handleGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 16);
    const handleMesh = new THREE.Mesh(handleGeo, goldRimMat);
    handleMesh.position.y = 1.7;
    clocheGroup.add(handleMesh);

    const knobGeo = new THREE.SphereGeometry(0.18, 20, 20);
    const knobMesh = new THREE.Mesh(knobGeo, goldRimMat);
    knobMesh.position.y = 1.9;
    clocheGroup.add(knobMesh);

    tableGroup.add(clocheGroup);
    clocheMesh = clocheGroup;

    // Steam Vapor Particles
    buildSteamVapor();
  }

  function buildCandleHolder(x, y, z) {
    const standGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.7, 16);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.5, metalness: 0.7 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(x, y + 0.35, z);
    tableGroup.add(stand);

    // Wax Candle
    const waxGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.7 });
    const wax = new THREE.Mesh(waxGeo, waxMat);
    wax.position.set(x, y + 1.0, z);
    tableGroup.add(wax);

    // Golden flame aura
    const flameGeo = new THREE.SphereGeometry(0.06, 12, 12);
    flameGeo.scale(1, 2, 1);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y + 1.48, z);
    tableGroup.add(flame);
  }

  /* ==========================================================================
     Procedural 3D Food Models
     ========================================================================== */
  function buildDishModels() {
    // 1. MUTTON KACCHI BIRYANI & TRADITIONAL MEALS
    const biryaniGroup = new THREE.Group();
    // Fragrant Saffron Basmati Rice Mound
    const riceGeo = new THREE.ConeGeometry(1.3, 0.75, 32);
    const riceMat = new THREE.MeshStandardMaterial({ color: 0xf5c065, roughness: 0.85 });
    const riceMesh = new THREE.Mesh(riceGeo, riceMat);
    riceMesh.position.y = 0.35;
    biryaniGroup.add(riceMesh);

    // Roasted Golden Potato
    const potatoGeo = new THREE.SphereGeometry(0.28, 16, 16);
    potatoGeo.scale(1.2, 0.9, 1.1);
    const potatoMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.6 });
    const potato = new THREE.Mesh(potatoGeo, potatoMat);
    potato.position.set(0.45, 0.38, 0.3);
    biryaniGroup.add(potato);

    // Roasted Mutton Chunks
    const meatMat = new THREE.MeshStandardMaterial({ color: 0x572212, roughness: 0.5 });
    const meat1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), meatMat);
    meat1.position.set(-0.35, 0.32, 0.4);
    biryaniGroup.add(meat1);

    const meat2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), meatMat);
    meat2.position.set(0.1, 0.42, -0.45);
    biryaniGroup.add(meat2);

    // Mint Leaf Garnishes
    const leafGeo = new THREE.PlaneGeometry(0.18, 0.28);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, side: THREE.DoubleSide });
    const leaf1 = new THREE.Mesh(leafGeo, leafMat);
    leaf1.rotation.set(-0.6, 0.4, 0.2);
    leaf1.position.set(0, 0.72, 0.05);
    biryaniGroup.add(leaf1);

    dishGroup.add(biryaniGroup);
    dishes3D['biryani'] = biryaniGroup;
    dishes3D['traditional'] = biryaniGroup;

    // 2. BENGALI MATKA MALAI TEA & BEVERAGES
    const teaGroup = new THREE.Group();
    // Handcrafted Terracotta Bhar (Clay Cup)
    const cupGeo = new THREE.CylinderGeometry(0.48, 0.32, 0.9, 24);
    const clayMat = new THREE.MeshStandardMaterial({ color: 0xa8512b, roughness: 0.9 });
    const cup = new THREE.Mesh(cupGeo, clayMat);
    cup.position.y = 0.45;
    teaGroup.add(cup);

    // Warm Spiced Milk Tea Liquid
    const teaLiquidGeo = new THREE.CircleGeometry(0.44, 24);
    const teaLiquidMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25 });
    const teaLiquid = new THREE.Mesh(teaLiquidGeo, teaLiquidMat);
    teaLiquid.rotation.x = -Math.PI / 2;
    teaLiquid.position.y = 0.88;
    teaGroup.add(teaLiquid);

    // Cinnamon Stick Garnish
    const cinnamonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
    const cinnamonMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const cinnamon = new THREE.Mesh(cinnamonGeo, cinnamonMat);
    cinnamon.rotation.set(0.2, 0.3, 0.35);
    cinnamon.position.set(0.2, 0.65, 0.1);
    teaGroup.add(cinnamon);

    teaGroup.visible = false;
    dishGroup.add(teaGroup);
    dishes3D['tea'] = teaGroup;
    dishes3D['lassi'] = teaGroup;

    // 3. HEARTY BREAKFAST (Flaky Parathas & Bhaji)
    const breakfastGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const parathaGeo = new THREE.CylinderGeometry(1.0 - i * 0.05, 1.0 - i * 0.05, 0.07, 32);
      const parathaMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.65 });
      const paratha = new THREE.Mesh(parathaGeo, parathaMat);
      paratha.position.set((i % 2 === 0 ? 0.05 : -0.05), 0.04 + i * 0.08, (i % 2 === 0 ? -0.04 : 0.04));
      breakfastGroup.add(paratha);
    }
    // Pat of melting golden butter on top
    const butterGeo = new THREE.BoxGeometry(0.25, 0.1, 0.25);
    const butterMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
    const butter = new THREE.Mesh(butterGeo, butterMat);
    butter.position.set(0, 0.32, 0);
    butter.rotation.y = 0.3;
    breakfastGroup.add(butter);

    // Clay bowl of spiced bhaji
    const bhajiBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.3, 20), clayMat);
    bhajiBowl.position.set(0.9, 0.15, 0.4);
    breakfastGroup.add(bhajiBowl);
    const bhajiContent = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    bhajiContent.rotation.x = -Math.PI / 2;
    bhajiContent.position.set(0.9, 0.29, 0.4);
    breakfastGroup.add(bhajiContent);

    breakfastGroup.visible = false;
    dishGroup.add(breakfastGroup);
    dishes3D['breakfast'] = breakfastGroup;

    // 4. GOURMET BURGERS
    const burgerGroup = new THREE.Group();
    // Bottom Bun
    const botBun = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.75, 0.25, 32), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }));
    botBun.position.y = 0.12;
    burgerGroup.add(botBun);

    // Seared Beef Patty
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.22, 32), new THREE.MeshStandardMaterial({ color: 0x3f1d15, roughness: 0.5 }));
    patty.position.y = 0.34;
    burgerGroup.add(patty);

    // Melted Cheddar Cheese Layer
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.95), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }));
    cheese.position.y = 0.48;
    cheese.rotation.y = 0.4;
    burgerGroup.add(cheese);

    // Crisp Lettuce
    const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 }));
    lettuce.position.y = 0.54;
    burgerGroup.add(lettuce);

    // Top Brioche Bun with Sesame
    const topBunGeo = new THREE.SphereGeometry(0.82, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const topBun = new THREE.Mesh(topBunGeo, new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }));
    topBun.position.y = 0.58;
    burgerGroup.add(topBun);

    burgerGroup.visible = false;
    dishGroup.add(burgerGroup);
    dishes3D['burger'] = burgerGroup;
    dishes3D['pizza'] = burgerGroup;

    // 5. TRADITIONAL SHAHI DESSERTS (Firni & Gulab Jamun)
    const dessertGroup = new THREE.Group();
    // Traditional Earthen Bowl
    const bowlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.5, 0.45, 24), clayMat);
    bowlMesh.position.y = 0.22;
    dessertGroup.add(bowlMesh);

    // Creamy Saffron Shahi Firni
    const firniSurface = new THREE.Mesh(new THREE.CircleGeometry(0.74, 24), new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 }));
    firniSurface.rotation.x = -Math.PI / 2;
    firniSurface.position.y = 0.44;
    dessertGroup.add(firniSurface);

    // Golden Brown Gulab Jamun Sphere
    const gulabJamun = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 20), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.35, metalness: 0.1 }));
    gulabJamun.position.set(0.15, 0.55, 0.1);
    dessertGroup.add(gulabJamun);

    dessertGroup.visible = false;
    dishGroup.add(dessertGroup);
    dishes3D['dessert'] = dessertGroup;

    // 6. SOUPS & APPETIZERS
    const soupGroup = new THREE.Group();
    const soupBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.4, 0.5, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    soupBowl.position.y = 0.25;
    soupGroup.add(soupBowl);

    const soupLiquid = new THREE.Mesh(new THREE.CircleGeometry(0.78, 28), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.2 }));
    soupLiquid.rotation.x = -Math.PI / 2;
    soupLiquid.position.y = 0.48;
    soupGroup.add(soupLiquid);

    // Crispy golden Singara / Samosa on side
    const samosaGeo = new THREE.ConeGeometry(0.3, 0.35, 3);
    const samosaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 });
    const samosa = new THREE.Mesh(samosaGeo, samosaMat);
    samosa.rotation.set(0.3, 0.5, 0.4);
    samosa.position.set(1.05, 0.15, 0.25);
    soupGroup.add(samosa);

    soupGroup.visible = false;
    dishGroup.add(soupGroup);
    dishes3D['soup'] = soupGroup;
  }

  /* ==========================================================================
     Atmospheric Floating Particles & Steam Vapor
     ========================================================================== */
  function buildAtmosphereParticles() {
    const particleCount = 280;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 8 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      scales[i] = Math.random() * 0.08 + 0.03;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom Canvas Texture for round glowing ember dots
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(254, 230, 138, 1)');
    grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.8)');
    grad.addColorStop(1, 'rgba(230, 57, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    ambientParticles = new THREE.Points(geo, mat);
    scene.add(ambientParticles);
  }

  function buildSteamVapor() {
    const steamCount = 55;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(steamCount * 3);

    for (let i = 0; i < steamCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 1] = 0.6 + Math.random() * 1.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 245, 220, 0.45)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    grad.addColorStop(1, 'rgba(20, 15, 10, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    steamParticles = new THREE.Points(geo, mat);
    dishGroup.add(steamParticles);
  }

  /* ==========================================================================
     Animation Loop & Camera Choreography
     ========================================================================== */
  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock ? clock.getElapsedTime() : 0;

    // 1. Natural Organic Candle Flame Flickering
    if (candleLight1 && candleLight2) {
      candleLight1.intensity = 2.4 + Math.sin(elapsedTime * 8) * 0.25 + Math.sin(elapsedTime * 17) * 0.15;
      candleLight2.intensity = 1.8 + Math.cos(elapsedTime * 6) * 0.2 + Math.sin(elapsedTime * 23) * 0.12;
    }

    // 2. Gentle Ambient Spice Particles Drifting
    if (ambientParticles) {
      const positions = ambientParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(elapsedTime + positions[i]) * 0.003 + 0.002;
        if (positions[i + 1] > 7.5) {
          positions[i + 1] = -0.5;
        }
      }
      ambientParticles.geometry.attributes.position.needsUpdate = true;
      ambientParticles.rotation.y = elapsedTime * 0.02;
    }

    // 3. Steam Rising Vortex Animation
    if (steamParticles && state.clocheLift > 0.3) {
      const pos = steamParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += 0.012;
        pos[i] += Math.sin(elapsedTime * 3 + pos[i + 1]) * 0.004;
        if (pos[i + 1] > 2.6) {
          pos[i + 1] = 0.5;
          pos[i] = (Math.random() - 0.5) * 0.5;
          pos[i + 2] = (Math.random() - 0.5) * 0.5;
        }
      }
      steamParticles.geometry.attributes.position.needsUpdate = true;
      steamParticles.material.opacity = Math.min(state.clocheLift, 0.7);
    }

    // 4. Cloche Lifting Animation (tied to scroll and inspect trigger)
    if (clocheMesh) {
      const targetY = 0.12 + state.clocheLift * 3.4;
      clocheMesh.position.y += (targetY - clocheMesh.position.y) * 0.08;
      // Slight elegant tilt when lifting
      const targetTilt = state.clocheLift * 0.2;
      clocheMesh.rotation.z += (targetTilt - clocheMesh.rotation.z) * 0.08;
    }

    // 5. Dining Table Rotation (damping lerp)
    if (tableGroup) {
      // Subtle continuous slow rotation if idle
      if (!state.isDragging) {
        state.targetTableRotationY += 0.0018;
      }
      state.tableRotationY += (state.targetTableRotationY - state.tableRotationY) * 0.08;
      tableGroup.rotation.y = state.tableRotationY;
    }

    // 6. Camera Parallax & Scroll Path Choreography
    state.mouseX += (state.targetMouseX - state.mouseX) * 0.05;
    state.mouseY += (state.targetMouseY - state.mouseY) * 0.05;

    // Choreographed camera positions based on scrollProgress
    // 0.0 (Hero): Frontal majestic overview
    // 0.3 (Heritage): Glides closer, table slightly tilted
    // 0.7 (Menu): Elevated inspection viewpoint
    // 1.0 (Info): Twilight dining panoramic
    const p = Math.min(Math.max(state.scrollProgress, 0), 1);

    const camStartX = 0, camStartY = 4.2, camStartZ = 8.8;
    const camMidX = -1.6, camMidY = 3.6, camMidZ = 6.8;
    const camMenuX = 1.4, camMenuY = 4.6, camMenuZ = 5.9;
    const camEndX = 0, camEndY = 3.8, camEndZ = 7.4;

    let targetCamX, targetCamY, targetCamZ;
    let lookTargetY = 0.6;

    if (p < 0.35) {
      const t = p / 0.35;
      targetCamX = camStartX + (camMidX - camStartX) * t;
      targetCamY = camStartY + (camMidY - camStartY) * t;
      targetCamZ = camStartZ + (camMidZ - camStartZ) * t;
      lookTargetY = 0.6 + t * 0.2;
    } else if (p < 0.75) {
      const t = (p - 0.35) / 0.4;
      targetCamX = camMidX + (camMenuX - camMidX) * t;
      targetCamY = camMidY + (camMenuY - camMidY) * t;
      targetCamZ = camMidZ + (camMenuZ - camMidZ) * t;
      lookTargetY = 0.8 + t * 0.1;
    } else {
      const t = (p - 0.75) / 0.25;
      targetCamX = camMenuX + (camEndX - camMenuX) * t;
      targetCamY = camMenuY + (camEndY - camMenuY) * t;
      targetCamZ = camMenuZ + (camEndZ - camMenuZ) * t;
      lookTargetY = 0.9 - t * 0.2;
    }

    // Add mouse parallax offsets
    camera.position.x += (targetCamX + state.mouseX * 1.2 - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - state.mouseY * 0.8 - camera.position.y) * 0.05;
    camera.position.z += (targetCamZ - camera.position.z) * 0.05;

    camera.lookAt(0, lookTargetY, 0);

    // Render Scene
    renderer.render(scene, camera);
  }

  /* ==========================================================================
     Interactions & 3D Card Tilt Mechanics
     ========================================================================== */
  function setupInteractions() {
    // Window Resize Handler
    window.addEventListener('resize', onWindowResize, { passive: true });

    // Scroll Progress Tracker
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mouse Move Parallax
    window.addEventListener('mousemove', (e) => {
      state.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      state.targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // 3D Table Drag Orbit (Desktop & Mobile Touch)
    const cvs = dom.canvas;
    if (cvs) {
      cvs.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        state.dragStartX = e.clientX;
      });

      window.addEventListener('mouseup', () => {
        state.isDragging = false;
      });

      window.addEventListener('mousemove', (e) => {
        if (!state.isDragging) return;
        const deltaX = e.clientX - state.dragStartX;
        state.targetTableRotationY += deltaX * 0.007;
        state.dragStartX = e.clientX;
      });

      // Touch events
      cvs.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          state.isDragging = true;
          state.dragStartX = e.touches[0].clientX;
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        state.isDragging = false;
      });

      window.addEventListener('touchmove', (e) => {
        if (!state.isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - state.dragStartX;
        state.targetTableRotationY += deltaX * 0.009;
        state.dragStartX = e.touches[0].clientX;
      }, { passive: true });
    }

    // Inspect Cloche Controls
    if (dom.inspectBtn) {
      dom.inspectBtn.addEventListener('click', toggleCloche);
    }
    if (dom.heroInspectBtn) {
      dom.heroInspectBtn.addEventListener('click', () => {
        state.clocheLift = 1;
        playAmbientBell();
      });
    }
    if (dom.resetCamBtn) {
      dom.resetCamBtn.addEventListener('click', () => {
        state.targetTableRotationY = 0;
        state.targetMouseX = 0;
        state.targetMouseY = 0;
      });
    }

    // Sound Toggle
    if (dom.soundToggleBtn) {
      dom.soundToggleBtn.addEventListener('click', toggleSound);
    }
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onScroll() {
    state.scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    state.scrollProgress = state.scrollY / maxScroll;

    // Automatically lift cloche when user scrolls past 150px
    if (state.scrollY > 150) {
      state.clocheLift = 1;
    } else {
      state.clocheLift = 0;
    }
  }

  function toggleCloche() {
    state.clocheLift = state.clocheLift > 0.5 ? 0 : 1;
    if (state.clocheLift > 0.5) {
      playAmbientBell();
    }
  }

  /* ==========================================================================
     Synthesized Luxury Dining Ambiance Sound
     ========================================================================== */
  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    if (dom.soundToggleBtn) {
      dom.soundToggleBtn.textContent = state.soundEnabled ? '🔔 Audio: On' : '🔕 Audio: Off';
      dom.soundToggleBtn.style.background = state.soundEnabled ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.1)';
    }
    if (state.soundEnabled) {
      playAmbientBell();
    }
  }

  function playAmbientBell() {
    if (!state.soundEnabled) return;
    try {
      if (!state.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioCtx = new AudioContext();
      }
      const ctx = state.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      // Delicate fine dining silver bell chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 bell chime
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      // Audio autoplay policy or not supported
    }
  }

  /* ==========================================================================
     Switch 3D Food Model Based on Category
     ========================================================================== */
  function switch3DModel(categoryName) {
    let targetType = 'biryani';
    const cat = (categoryName || '').toLowerCase();

    if (cat.includes('breakfast')) {
      targetType = 'breakfast';
    } else if (cat.includes('tea') || cat.includes('coffee')) {
      targetType = 'tea';
    } else if (cat.includes('burger')) {
      targetType = 'burger';
    } else if (cat.includes('pizza') || cat.includes('pasta')) {
      targetType = 'burger'; // shares Western gourmet group
    } else if (cat.includes('dessert')) {
      targetType = 'dessert';
    } else if (cat.includes('soup') || cat.includes('appetizer')) {
      targetType = 'soup';
    } else if (cat.includes('lassi') || cat.includes('juice')) {
      targetType = 'tea';
    } else {
      targetType = 'biryani';
    }

    state.activeModelType = targetType;

    // Show only the selected dish group
    Object.keys(dishes3D).forEach((key) => {
      if (dishes3D[key]) {
        dishes3D[key].visible = (key === targetType);
      }
    });

    // Make sure cloche lifts to reveal the dish
    state.clocheLift = 1;

    // Pulse top spotlight
    if (topSpotLight) {
      topSpotLight.intensity = 4.8;
      setTimeout(() => {
        if (topSpotLight) topSpotLight.intensity = 3.2;
      }, 350);
    }
  }

  /* ==========================================================================
     Content Sync & Dynamic API Fetching
     ========================================================================== */
  async function loadRestaurantContent() {
    let data = null;

    // 1. Try Live Server API (/api/content)
    try {
      const res = await fetch('/api/content?t=' + Date.now(), {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch (apiErr) {
      // Silent fallback
    }

    // 2. Fallback to static JSON file (data/content.json for GitHub Pages)
    if (!data) {
      try {
        const res = await fetch('data/content.json?t=' + Date.now());
        if (res.ok) {
          data = await res.json();
        }
      } catch (staticErr) {
        console.warn('Fallback static fetch failed:', staticErr);
      }
    }

    if (data) {
      state.content = data;
      renderContent(data);
    }
  }

  function renderContent(data) {
    if (!data) return;

    // 1. Render Hero & Meta
    if (data.hero) {
      if (dom.heroSubtitle && data.hero.subtitle) dom.heroSubtitle.textContent = data.hero.subtitle;
    }
    if (data.contact) {
      if (dom.heroMetaHours) dom.heroMetaHours.textContent = '⏰ ' + (data.contact.hours || '7:00 AM – 11:30 PM');
      if (dom.heroMetaAddress) dom.heroMetaAddress.textContent = '📍 ' + (data.contact.address || '10, Shahbagh Biponi Bithan, Dhaka');
      if (dom.infoAddress) dom.infoAddress.textContent = data.contact.address || '10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh';
      if (dom.infoHours) dom.infoHours.textContent = data.contact.hours || 'Daily 7:00 AM – 11:30 PM';
      if (dom.infoPhone) {
        dom.infoPhone.textContent = data.contact.phone || '+8801734489275';
        dom.infoPhone.href = 'tel:' + (data.contact.phone || '+8801734489275');
      }
      if (dom.infoEmail) {
        dom.infoEmail.textContent = data.contact.email || 'sylvanarestaurantbd@gmail.com';
        dom.infoEmail.href = 'mailto:' + (data.contact.email || 'sylvanarestaurantbd@gmail.com');
      }
    }

    // 2. Render Heritage Stories
    if (data.about) {
      if (dom.heritageStory1 && data.about.story1) dom.heritageStory1.textContent = data.about.story1;
      if (dom.heritageStory2 && data.about.story2) dom.heritageStory2.textContent = data.about.story2;
    }

    // 3. Render Metrics
    if (data.metrics && dom.heritageMetricItems) {
      dom.heritageMetricItems.innerHTML = data.metrics.map(m => `
        <div class="metric-box">
          <div class="metric-val">${escapeHtml(m.value)}</div>
          <div class="metric-lbl">${escapeHtml(m.label)}</div>
        </div>
      `).join('');
    }

    // 4. Render Category Tabs & Menu Cards
    if (data.menu) {
      renderCategoryTabs(data.menu.categories || []);
      renderMenuCards(data.menu.items || []);
    }
  }

  /* ==========================================================================
     Category Filter Tabs
     ========================================================================== */
  function renderCategoryTabs(categories) {
    if (!dom.categoryFilterStrip) return;

    const allItems = (state.content && state.content.menu && state.content.menu.items) || [];

    // Ensure 'All Dishes' is first
    const cleanCats = ['All Dishes'].concat(categories.filter(c => c !== 'All Dishes'));

    dom.categoryFilterStrip.innerHTML = cleanCats.map(cat => {
      const count = cat === 'All Dishes' ? allItems.length : allItems.filter(i => i.category === cat).length;
      const isActive = cat === state.selectedCategory;
      return `
        <button class="category-pill ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat)}">
          <span>${escapeHtml(cat)}</span>
          <span class="category-count">${count}</span>
        </button>
      `;
    }).join('');

    // Attach click handlers
    dom.categoryFilterStrip.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        selectCategory(cat);
      });
    });
  }

  function selectCategory(category) {
    state.selectedCategory = category;

    // Update Tab Styles
    if (dom.categoryFilterStrip) {
      dom.categoryFilterStrip.querySelectorAll('.category-pill').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
      });
    }

    // Switch 3D Model
    switch3DModel(category);

    // Filter Menu Cards
    const items = (state.content && state.content.menu && state.content.menu.items) || [];
    renderMenuCards(items);

    playAmbientBell();
  }

  /* ==========================================================================
     3D Interactive Menu Cards Grid
     ========================================================================== */
  function renderMenuCards(items) {
    if (!dom.menuGrid) return;

    let filtered = items;
    if (state.selectedCategory && state.selectedCategory !== 'All Dishes') {
      filtered = items.filter(it => it.category === state.selectedCategory);
    }

    if (filtered.length === 0) {
      dom.menuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          No dishes found in this category.
        </div>
      `;
      return;
    }

    // Default featured dish if none selected
    if (!state.featuredDish) {
      state.featuredDish = filtered[0];
      updateSpotlightBanner(filtered[0]);
    }

    dom.menuGrid.innerHTML = filtered.map(item => {
      const isFocused = state.featuredDish && state.featuredDish.id === item.id;
      const icon = item.icon || '🍽️';
      const badge = item.badge || (item.isSpecial ? "Chef's Special" : 'Traditional');
      const dietaryClass = (item.dietary || '').toLowerCase().includes('veg') && !(item.dietary || '').toLowerCase().includes('non') ? 'veg' : 'non-veg';

      return `
        <div class="menu-3d-card interactive-layer ${isFocused ? 'focused-card' : ''}" data-dish-id="${escapeHtml(item.id)}">
          <div class="card-glare"></div>

          <div class="card-layer-top">
            <span class="card-badge">${escapeHtml(badge)}</span>
            <div class="dietary-tag">
              <span class="dietary-dot ${dietaryClass}"></span>
              <span>${escapeHtml(item.dietary || 'Halal')}</span>
            </div>
          </div>

          <div class="card-layer-body">
            <div class="dish-header-row">
              <span class="dish-icon">${icon}</span>
              <div>
                <h3 class="dish-name">${escapeHtml(item.name)}</h3>
                <span class="dish-category-lbl">${escapeHtml(item.category)}</span>
              </div>
            </div>
            <p class="dish-desc">${escapeHtml(item.description || 'Prepared fresh with authentic spices at Shahbagh.')}</p>
          </div>

          <div class="card-layer-bottom">
            <div class="dish-price-tag">
              <span class="currency-symbol">${escapeHtml(item.currency || '৳')}</span>
              <span>${item.price}</span>
            </div>
            <button class="dish-inspect-btn" type="button" aria-label="Spotlight ${escapeHtml(item.name)} in 3D Table">
              <span>✨ Spotlight in 3D</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach 3D Tilt and Focus Events to all cards
    attachCardTiltEvents();
  }

  function attachCardTiltEvents() {
    const cards = dom.menuGrid.querySelectorAll('.menu-3d-card');
    cards.forEach(card => {
      const glare = card.querySelector('.card-glare');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        if (glare) {
          glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.16) 0%, transparent 65%)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });

      card.addEventListener('click', () => {
        const dishId = card.getAttribute('data-dish-id');
        const items = (state.content && state.content.menu && state.content.menu.items) || [];
        const dish = items.find(d => d.id === dishId);
        if (dish) {
          focusDish(dish);
        }
      });
    });
  }

  function focusDish(dish) {
    state.featuredDish = dish;

    // Update Cards styling
    dom.menuGrid.querySelectorAll('.menu-3d-card').forEach(c => {
      c.classList.toggle('focused-card', c.getAttribute('data-dish-id') === dish.id);
    });

    // Update Spotlight Banner
    updateSpotlightBanner(dish);

    // Switch 3D Model matching this dish's category
    switch3DModel(dish.category);

    playAmbientBell();
  }

  function updateSpotlightBanner(dish) {
    if (!dish) return;
    if (dom.spotlightIcon) dom.spotlightIcon.textContent = dish.icon || '🍽️';
    if (dom.spotlightDishName) dom.spotlightDishName.textContent = dish.name;
    if (dom.spotlightDishPrice) dom.spotlightDishPrice.textContent = `${dish.currency || '৳'} ${dish.price} BDT`;
    if (dom.spotlightLabel) dom.spotlightLabel.textContent = `NOW SPOTLIGHTING • ${dish.category.toUpperCase()}`;
  }

  /* ==========================================================================
     Utilities
     ========================================================================== */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Self Initialization
  window.addEventListener('DOMContentLoaded', () => {
    initThree();
    loadRestaurantContent();
  });

})();
