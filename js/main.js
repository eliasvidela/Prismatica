import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

// ============================================================
// CARGADOR DE MODELOS 3D
// Todos los modelos .glb/.gltf interactivos se cargan mediante
// esta instancia.
//
// PARA CAMBIAR LOS MODELOS:
// modifica las rutas dentro de hotspotData.
// ============================================================
const controllerLoader = new GLTFLoader();
const islaLoader = new GLTFLoader();
let islaModel = null;

// Interacción de rotación de modelos 3D
const modelRaycaster = new THREE.Raycaster();
const modelPointer = new THREE.Vector2();
let rotatingModel = null;
let rotatingModelStartX = 0;
let rotatingModelStartY = 0;
let rotatingModelBaseY = 0;


/* ============================================================
   EXPERIENCIA INMERSIVA — BASE V1
   Three.js + GSAP
   ============================================================ */

const state = {
    currentHotspot: null,
    introShown: true,
    experienceStarted: false
};

const hotspotData = [
    {
        id: 0,
        number: "01",
        category: "INMERSIÓN",
        title: "Entornos 360°",
        description: "Explora situaciones reales desde cualquier ángulo y transporta al participante directamente al lugar donde ocurre el aprendizaje, creando una experiencia cercana, visual y envolvente.",
        label: "ENTORNOS 360°",

        model: "./assets/models/insta.glb",
        
        modelScale: .5,
        modelPosition: {
            x: 0,
            y: 0,
            z: 0
        },
        modelRotation: {
            x: 0,
            y: 0,
            z: 0
        },

        position: {
            x: -6,
            y: 1.8,
            z: -2
        }
    },

    {
        id: 1,
        number: "02",
        category: "SIMULACIÓN",
        title: "Realidad Virtual",
        description: "Practica situaciones complejas en entornos seguros y controlados mediante experiencias inmersivas para dispositivos como Meta Quest, sin las consecuencias de una situación real.",
        label: "REALIDAD VIRTUAL",

        model: "./assets/models/meta.glb",
        modelScale: .5,
        modelPosition: {
            x: 0,
            y: 0,
            z: 0
        },
        modelRotation: {
            x: 0,
            y: 0,
            z: 0
        },

        position: {
            x: 5,
            y: 2.2,
            z: -4
        }
    },

    {
        id: 2,
        number: "03",
        category: "INTERACCIÓN",
        title: "Entornos interactivos",
        description: "Transformamos contenidos estáticos en espacios digitales donde cada participante puede explorar, descubrir información y tomar decisiones a través de una experiencia activa y dinámica.",
        label: "INTERACTIVIDAD",

        model: "./assets/models/note.glb",
        modelScale: .5,
        modelPosition: {
            x: 0,
            y: 0,
            z: 0
        },
        modelRotation: {
            x: 0,
            y: 0,
            z: 0
        },

        position: {
            x: 7,
            y: 1.6,
            z: 3
        }
    },

    {
        id: 3,
        number: "04",
        category: "MOTIVACIÓN",
        title: "Gamificación",
        description: "Incorporamos desafíos, progresión, recompensas y decisiones para convertir el aprendizaje en una experiencia activa, participativa y orientada a la acción.",
        label: "GAMIFICACIÓN",

        model: "./assets/models/controller.glb",
        modelScale: .4,
        modelPosition: {
            x: 0,
            y: 0,
            z: 0
        },
        modelRotation: {
            x: 0,
            y: 0,
            z: 0
        },

        position: {
            x: -4,
            y: 2.3,
            z: 5
        }
    },

    {
        id: 4,
        number: "05",
        category: "DESARROLLO ORGANIZACIONAL",
        title: "Team Building",
        description: "Diseñamos experiencias para fortalecer equipos, mejorar su funcionamiento y alcanzar objetivos concretos. Cada experiencia comienza con un propósito de aprendizaje y se construye a su alrededor.",
        label: "TEAM BUILDING",

        model: "./assets/models/zen.glb",
        modelScale: .5,
        modelPosition: {
            x: 0,
            y: 0,
            z: 0
        },
        modelRotation: {
            x: 0,
            y: 0,
            z: 0
        },

        position: {
            x: 0,
            y: 3.1,
            z: 0
        }
    }
];

/* ============================================================
   DOM
   ============================================================ */

const intro = document.getElementById("intro");
const experience = document.getElementById("experience");
const startButton = document.getElementById("startExperience");
const homeButton = document.getElementById("homeButton");

const mapButton = document.getElementById("mapButton");
const chaptersButton = document.getElementById("chaptersButton");
const menuButton = document.getElementById("menuButton");

const infoPanel = document.getElementById("infoPanel");
const closeInfo = document.getElementById("closeInfo");

const infoNumber = document.getElementById("infoNumber");
const infoCategory = document.getElementById("infoCategory");
const infoTitle = document.getElementById("infoTitle");
const infoDescription = document.getElementById("infoDescription");

const mapOverlay = document.getElementById("mapOverlay");
const chaptersOverlay = document.getElementById("chaptersOverlay");
const menuOverlay = document.getElementById("menuOverlay");
const contactOverlay = document.getElementById("contactOverlay");
const closeContact = document.getElementById("closeContact");

const instructions = document.getElementById("instructions");
const progressBar = document.getElementById("progressBar");

const galleryPanel = document.getElementById("galleryPanel");
const closeGallery = document.getElementById("closeGallery");
const galleryMainImage = document.getElementById("galleryMainImage");
const galleryMainTitle = document.getElementById("galleryMainTitle");
const galleryCounter = document.getElementById("galleryCounter");
const galleryThumbs = document.getElementById("galleryThumbs");
const galleryPrev = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");

/* ============================================================
   THREE.JS
   ============================================================ */

let scene;
let camera;
let renderer;
let composer;
let bloomPass;
let clock;
let dustParticles;

const mixers = [];

let world;
let cameraTarget;
let hotspots = [];
let hotspotElements = [];

// Cada hotspot queda físicamente vinculado a uno de los cubos.
// Así, si el mundo gira, el punto se mueve con su geometría.amera
let hotspotParents = [];
let focusTween = null;
let hotspotsFading = false;
let hotspotsVisible = true;
let isCameraFocused = false;
let savedCameraState = null;
let floatingBackgroundObjects = [];

// ============================================================
// MODELOS 3D INTERACTIVOS TEMPORALES
// Reemplaza TODOS los puntos interactivos visuales.
// Para cambiar los modelos definitivos, modifica esta ruta.


let isDragging = false;
let previousMouse = { x: 0, y: 0 };

let targetRotationY = 0;
let currentRotationY = 0;

let targetRotationX = 0;
let currentRotationX = 0;

let mouse = {
    x: 0,
    y: 0
};

let galleryIndex = 0;
let galleryImages = [];

function initThree() {

    scene = new THREE.Scene();

    // Fondo degradado global: reemplaza la antigua esfera de fondo.
    scene.background = createGradientBackground();
    //scene.fog = null;

    scene.fog = new THREE.Fog( 0xea9999, 0, 100 );

    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    // ============================================================
    // CÁMARA INICIAL — CENTRADA EN LA SALA
    // La cámara queda sobre el eje central para tener una lectura
    // más equilibrada de los cinco pedestales y sus modelos.
    // ============================================================
    camera.position.set(0, 3.6, 9.0);
    camera.userData.orbitDistance = 18;

    cameraTarget = new THREE.Vector3(0, 2.25, 0);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });

    // ============================================================
    // CALIDAD DE RENDER
    // Antialias nativo + mayor resolución interna.
    // ============================================================
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    document.getElementById("canvas-container").appendChild(renderer.domElement);

    composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0,
        0,
        0
    );
    composer.addPass(bloomPass);

    // 3. Añadir el paso de Oclusión Ambiental (SSAO)
const width = window.innerWidth;
const height = window.innerHeight;
const ssaoPass = new SSAOPass(scene, camera, width, height);

// Ajustes recomendados para calibrar la intensidad del SSAO
ssaoPass.kernelRadius = .2;       // Radio del efecto (sombras más amplias o cerradas)
ssaoPass.minDistance = 0.05;    // Distancia mínima para que actúe
ssaoPass.maxDistance = 0.5;      // Distancia máxima de alcance
composer.addPass(ssaoPass);

// ============================================================
// SMAA — ANTIALIASING ADICIONAL
// Suaviza bordes finos de cubos y modelos GLB.
// ============================================================
const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

// 4. Asegura la salida de color correcta en pantalla (Gamma/Linear)
const outputPass = new OutputPass();
composer.addPass(outputPass);

    clock = new THREE.Clock();

createLights();
createWorld();
createIsla();
createHotspots();
createDustParticles();

// ============================================================
// CARGAR MODELOS 3D DE LOS HOTSPOTS
// Aquí se cargan los .glb después de crear sus anchors.
// ============================================================
loadControllersForAllHotspots();

window.addEventListener("resize", onResize);

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    animate();
}

/* ============================================================
   FONDO DEGRADADO
   ============================================================ */

function createGradientBackground() {

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    const ctx = canvas.getContext("2d");

    // Degradado vertical coral -> crema -> coral oscuro.
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#722625");
    gradient.addColorStop(0.42, "#fc8261");
    gradient.addColorStop(0.72, "#eb5945");
    gradient.addColorStop(1, "#722625");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mancha suave central para dar profundidad sin una esfera.
    const glow = ctx.createRadialGradient(
        canvas.width * 0.5,
        canvas.height * 0.43,
        20,
        canvas.width * 0.5,
        canvas.height * 0.43,
        canvas.width * 0.52
    );

    glow.addColorStop(0, "rgba(255, 235, 225, 0.30)");
    glow.addColorStop(0.55, "rgba(255, 205, 190, 0.10)");
    glow.addColorStop(1, "rgba(120, 45, 45, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

function createFloatingBackgroundObjects() {
    const group = new THREE.Group();
    group.name = "floatingBackgroundObjects";

    const materials = [
        new THREE.MeshStandardMaterial({
            color: 0xffc945,
            roughness: 0.55,
            metalness: 0.15,
            transparent: true,
            opacity: 0.65
        }),
        new THREE.MeshStandardMaterial({
            color: 0x6fa8dc,
            roughness: 0.6,
            metalness: 0.1,
            transparent: true,
            opacity: .5,
        }),
        new THREE.MeshStandardMaterial({
            color: 0xe06666,
            roughness: 0.45,
            metalness: 0.2,
            transparent: true,
            opacity: 0.58
        })
    ];

    // Distribución alrededor de toda la escena.
    // Los objetos están bastante más lejos del área jugable.
    const objects = [
        // ─────────────── NORTE ───────────────
        { type: "sphere", pos: [0, 10, -22], scale: 1.5 },
        { type: "torus",  pos: [-11, 8, -24], scale: 1.8, rot: [1.2, 0.3, 0.5] },
        { type: "cube",   pos: [14, 12, -26], scale: 1.7, rot: [0.4, 0.8, 0.2] },

        // ─────────────── SUR ───────────────
        { type: "sphere", pos: [-15, 6, 18], scale: 1.1 },
        { type: "torus",  pos: [12, 9, 22], scale: 1.5, rot: [0.4, 1.2, 0.7] },
        { type: "cube",   pos: [0, 13, 25], scale: 2.0, rot: [0.8, 0.2, 0.5] },

        // ─────────────── ESTE ───────────────
        { type: "sphere", pos: [24, 6, -8], scale: 1.4 },
        { type: "torus",  pos: [27, 11, 8], scale: 1.8, rot: [0.6, 0.8, 0.2] },
        { type: "cube",   pos: [22, 14, -20], scale: 1.3, rot: [0.2, 0.5, 0.9] },

        // ─────────────── OESTE ───────────────
        { type: "sphere", pos: [-25, 9, 5], scale: 1.7 },
        { type: "torus",  pos: [-28, 13, -12], scale: 1.3, rot: [1.0, 0.4, 0.8] },
        { type: "cube",   pos: [-23, 15, 18], scale: 1.8, rot: [0.5, 1.0, 0.3] },

        // ─────────────── ALTOS ───────────────
        { type: "sphere", pos: [8, 18, -10], scale: 1.2 },
        { type: "torus",  pos: [-10, 20, 4], scale: 1.6, rot: [0.8, 0.2, 1.1] },
        { type: "cube",   pos: [18, 19, 12], scale: 1.5, rot: [0.3, 0.7, 0.6] },

        // ─────────────── MUY LEJANOS ───────────────
        { type: "sphere", pos: [-32, 17, -25], scale: 1.8 },
        { type: "torus",  pos: [32, 8, -28], scale: 2.0, rot: [1.1, 0.5, 0.3] },
        { type: "cube",   pos: [-30, 21, 28], scale: 1.6, rot: [0.7, 0.4, 1.0] },
        { type: "sphere", pos: [30, 22, 25], scale: 1.4 }
    ];

    objects.forEach((data, index) => {

        let geometry;

        if (data.type === "sphere") {
            geometry = new THREE.SphereGeometry(1, 32, 32);
        }

        else if (data.type === "torus") {
            geometry = new THREE.TorusGeometry(
                1.2,
                0.28,
                24,
                64
            );
        }

        else if (data.type === "cube") {
            geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
        }

        const material = materials[index % materials.length].clone();

        const mesh = new THREE.Mesh(
            geometry,
            material
        );

        mesh.position.set(
            data.pos[0],
            data.pos[1],
            data.pos[2]
        );

        mesh.scale.setScalar(data.scale);

        if (data.rot) {
            mesh.rotation.set(
                data.rot[0],
                data.rot[1],
                data.rot[2]
            );
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Animación individual
        mesh.userData.baseX = data.pos[0];
        mesh.userData.baseY = data.pos[1];
        mesh.userData.baseZ = data.pos[2];

mesh.userData.floatSpeed =
    0.03 + Math.random() * 0.04;

        mesh.userData.floatOffset =
            Math.random() * Math.PI * 2;

        mesh.userData.rotationX =
            (Math.random() - 0.5) * 0.004;

        mesh.userData.rotationY =
            (Math.random() - 0.5) * 0.006;

        mesh.userData.rotationZ =
            (Math.random() - 0.5) * 0.003;

        group.add(mesh);
        floatingBackgroundObjects.push(mesh);
    });

    scene.add(group);
}

/* ============================================================
   PARTICULAS DE POLVO
   ============================================================ */

function createDustParticles() {

    const count = 850;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {

        positions[i * 3] =
            (Math.random() - 0.5) * 22;

        positions[i * 3 + 1] =
            0.4 + Math.random() * 9;

        positions[i * 3 + 2] =
            (Math.random() - 0.5) * 18;

        sizes[i] =
            0.018 + Math.random() * 0.035;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
        "size",
        new THREE.BufferAttribute(sizes, 1)
    );

    const material = new THREE.PointsMaterial({
        color: 0xffeee5,
        size: 0.045,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    dustParticles = new THREE.Points(
        geometry,
        material
    );

    dustParticles.name = "floatingDust";

    scene.add(dustParticles);
}

/* ============================================================
   LIGHTS
   ============================================================ */

function createLights() {

    const ambient = new THREE.HemisphereLight(
        0xffe6dd,
        0xb75d53,
        1.25
    );

    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(
        0xfff4ee,
        1.2
    );

    mainLight.position.set(-6, 16, 9);
    mainLight.castShadow = true;

    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 45;
    mainLight.shadow.camera.left = -18;
    mainLight.shadow.camera.right = 18;
    mainLight.shadow.camera.top = 18;
    mainLight.shadow.camera.bottom = -18;

    mainLight.shadow.bias = -0.0002;

    scene.add(mainLight);

    // Iluminación amplia y difusa para una estética high-key / liminal.
    const softKey = new THREE.RectAreaLight(0xffeee7, 7, 12, 8);
    softKey.position.set(-4, 15, 4);
    softKey.lookAt(0, 0, 0);
    scene.add(softKey);

    const warmFill = new THREE.RectAreaLight(0xffc5ba, 4.5, 10, 1);
    warmFill.position.set(7, 6, -4);
    warmFill.lookAt(0, 1, 0);
    scene.add(warmFill);
}

/* ============================================================
   WORLD
   ============================================================ */

function createWorld() {

    // ============================================================
    // ESCENARIO LIMPIO
    //
    // Se eliminaron:
    // - Las cuatro paredes
    // - Techo
    // - Molduras / zócalos
    // - Paneles decorativos
    // - Lámpara superior
    // - Cualquier malla utilizada para simular la luz del techo
    //
    // El fondo ahora es el degradado global de la escena.
    // ============================================================

    world = new THREE.Group();
    scene.add(world);

    // ============================================================
    // PISO
    // ============================================================

   const floorGeometry = new THREE.CircleGeometry(0, 128);
//const floorGeometry = new THREE.CircleGeometry(10, 128);

const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xcf3131,
    roughness: 0.9,
    metalness: 0.0,
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);

floor.rotation.x = -Math.PI / 2;
floor.position.y=-.1;
floor.receiveShadow = true;

world.add(floor);
createFloatingBackgroundObjects();

    // ============================================================
    // CINCO PEDESTALES — CUBOS
    // ============================================================

    const cubeDefinitions = [
        [-6.0, 1.45, -2.9, 2.9, 2.9, 2.9],
        [ 6.0, 1.45, -2.9, 2.9, 2.9, 2.9],
        [ 0.0, 1.45, -6.2, 2.9, 2.9, 2.9],
        [-5.6, 1.45,  4.1, 2.9, 2.9, 2.9],
        [ 5.6, 1.45,  4.1, 2.9, 2.9, 2.9]
    ];

    cubeDefinitions.forEach((definition, index) => {

        const cube = createStructure(...definition);

        cube.userData.hotspotId = index;

        hotspotParents[index] = cube;
    });
}

function createStructure(x, y, z, width, height, depth) {

    // ============================================================
    // PEDESTAL CÚBICO
    // Cada figura 3D vive sobre este cubo.
    // ============================================================

    const geometry = new THREE.BoxGeometry(
        width/2,
        height,
        depth/2
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0xffb999,
        roughness: 0.88,
        metalness: 0
    });

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    world.add(mesh);

    // Tapa ligeramente más clara para reforzar el pedestal.
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(width * .5, 0.10, depth * 0.5),
        new THREE.MeshStandardMaterial({
            color: 0x45818e,
            roughness: 0.32,
            metalness: 0.02
        })
    );
    top.position.y = height / 2 + 0.05;
    top.castShadow = true;
    mesh.add(top);

    // Línea/base inferior muy discreta.
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(width * .65, 0.20, depth * .65),
        new THREE.MeshStandardMaterial({
            color: 0xf44336,
            roughness: 0.62,
            metalness: 0.05
        })
    );
    base.position.y = -height / 2 - 0.05;
    mesh.add(base);

    return mesh;
}


/* ============================================================
   ISLA CENTRAL
   ============================================================

   La isla ocupa prácticamente el mismo diámetro que el piso
   circular (radio 10 = diámetro 20). Se centra automáticamente
   en X/Z y se apoya sobre el nivel del piso.
   ============================================================ */

function createIsla() {

    islaLoader.load(
        "./assets/models/isla.glb",

        (gltf) => {

            const model = gltf.scene;
            model.name = "islaCentral";

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                }
            });

            // ----------------------------------------------------
            // ESCALA AUTOMÁTICA
            // El piso tiene radio 10, por lo que su diámetro es 20.
            // Ajustamos la isla para que su dimensión horizontal
            // máxima sea exactamente ese diámetro.
            // ----------------------------------------------------

            model.updateMatrixWorld(true);

            const bounds = new THREE.Box3().setFromObject(model);
            const size = bounds.getSize(new THREE.Vector3());
            const horizontalSize = Math.max(size.x, size.z);

            const floorDiameter = 20;
            const scale = floorDiameter / horizontalSize;

            model.scale.setScalar(scale);

            // Actualizamos bounds después de escalar.
            model.updateMatrixWorld(true);

            const scaledBounds = new THREE.Box3().setFromObject(model);
            const center = scaledBounds.getCenter(new THREE.Vector3());

            // Centrar horizontalmente la isla sobre el piso.
            model.position.x -= center.x;
            model.position.z -= center.z;

            // Apoyar la parte inferior de la isla sobre el piso.
            model.position.y += -10.35 - scaledBounds.min.y;

            // Si el modelo contiene animaciones, reproducir la primera.
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.reset();
                action.play();
                mixers.push(mixer);
            }

            world.add(model);
            islaModel = model;

            console.log(
                `✅ Isla central cargada. Escala aplicada: ${scale.toFixed(4)}`
            );
        },

        (progress) => {
            if (progress.total) {
                const percent =
                    (progress.loaded / progress.total) * 100;

                console.log(
                    `🏝️ Cargando isla: ${percent.toFixed(0)}%`
                );
            }
        },

        (error) => {
            console.error(
                "❌ No se pudo cargar isla.glb:",
                error
            );
        }
    );
}

/* ============================================================
   HOTSPOTS
   ============================================================ */

function createHotspots() {

    hotspotData.forEach((data, index) => {

        const parent =
            hotspotParents[index];

        if (!parent) return;

        const element =
            document.createElement("button");

        element.className =
            "hotspot";

        element.dataset.id =
            data.id;

        element.setAttribute(
            "aria-label",
            data.title
        );

        element.innerHTML = `
            <span class="hotspot-label">
                ${data.label}
            </span>
        `;

        element.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                focusHotspot(
                    data.id
                );

            }
        );

        document
            .getElementById("canvas-container")
            .appendChild(element);

        hotspotElements.push(element);


        // =====================================================
        // ANCHOR 3D
        // =====================================================

        const controllerAnchor =
            new THREE.Group();

        controllerAnchor.name =
            `interactiveController_${index}`;

        // El anchor queda SOBRE el cubo.
        // Esto hace que cualquier modelo futuro permanezca pegado al pedestal.
        controllerAnchor.position.set(
            0,
            parent.geometry.parameters.height / 2 + 0.18,
            0
        );

        parent.add(
            controllerAnchor
        );

        hotspots.push(
            controllerAnchor
        );

        // =====================================================
        // PLATAFORMA DE PRESENTACIÓN DEL PRODUCTO
        // Se crea debajo del modelo 3D sin alterar su anchor.
        // =====================================================
        createProductPresentation(controllerAnchor, index);

    });


}

/* ============================================================
   PLATAFORMAS DE PRESENTACIÓN — PRODUCT SHOWCASE
   ============================================================

   Cada modelo 3D recibe: 
   - pedestal cilíndrico
   - disco superior luminoso
   - anillos de luz
   - luz real hacia arriba
   - cono de luz falso-volumétrico

   Three.js sin postprocesado no genera volumetría física real,
   por eso el haz se simula con geometría transparente + additive.
   ============================================================ */

function createProductPresentation(anchor, index) {

    if (!anchor) return;

    // ============================================================
    // PRESENTACIÓN DEL MODELO
    // Ya no usamos pedestales cilíndricos.
    // El pedestal REAL es el cubo creado en createStructure().
    // Aquí solo agregamos una pequeña luz de apoyo sobre su tapa.
    // ============================================================

    const presentation = new THREE.Group();
    presentation.name = `productPresentation_${index}`;
    presentation.position.set(0, 1, 0);
    anchor.add(presentation);

    const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0, 0),
        new THREE.MeshBasicMaterial({
            color: 0xffc4b4,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.04;
    presentation.add(glow);



    presentation.userData.glow = glow;

    presentation.userData.index = index;
}

/* ============================================================
   CARGA DE MODELOS 3D INDIVIDUALES
   ============================================================ */

function loadControllersForAllHotspots() {

    hotspotData.forEach((data, index) => {

        const parent = hotspotParents[index];

        if (!parent) {
            console.warn(
                `⚠ No existe parent para hotspot ${index}`
            );
            return;
        }

        const anchor = parent.getObjectByName(
            `interactiveController_${index}`
        );

        if (!anchor) {
            console.warn(
                `⚠ No existe anchor para hotspot ${index}`
            );
            return;
        }

        loadHotspotModel(
            data,
            index,
            anchor
        );
    });
}


/* ============================================================
   CARGAR MODELO GLB DE UN HOTSPOT
   ============================================================ */

function loadHotspotModel(data, index, anchor) {

    if (!data.model) {

        console.warn(
            `⚠ Hotspot ${index} no tiene modelo definido`
        );

        return;
    }

    console.log(
        `🔄 Cargando modelo ${index}: ${data.model}`
    );

    controllerLoader.load(

        data.model,

        /* =====================================================
           ÉXITO
           ===================================================== */

        (gltf) => {

            const model = gltf.scene;

            model.name = `controller_${index}`;
            model.userData.interactiveRotationY = 0;
            model.userData.interactiveRotationX = 0;

            /* =================================================
               MATERIALES
               ================================================= */

            model.traverse((child) => {

                if (child.isMesh) {

                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {
                        child.material.needsUpdate = true;
                    }

                }

            });


            /* =================================================
               ESCALA
               ================================================= */

            const scale = data.modelScale ?? 50;

            model.scale.setScalar(scale);

            // =================================================
            // APOYO SOBRE EL PEDESTAL
            // Cada modelo se ajusta automáticamente para que su
            // punto más bajo quede sobre la tapa del cubo.
            // Esto permite cambiar de modelo sin recalcular a mano.
            // =================================================
            model.updateMatrixWorld(true);
            const modelBounds = new THREE.Box3().setFromObject(model);
            const modelBottom = modelBounds.min.y;
            data.modelPosition = data.modelPosition ?? { x: 0, y: 0, z: 0 };
            data.modelPosition.y += -modelBottom;


            /* =================================================
               POSICIÓN
               ================================================= */

            const position = data.modelPosition ?? {
                x: 0,
                y: 0,
                z: 0
            };

            model.position.set(
                position.x,
                position.y,
                position.z
            );


            /* =================================================
               ROTACIÓN
               ================================================= */

            const rotation = data.modelRotation ?? {
                x: 0,
                y: 0,
                z: 0
            };

            model.rotation.set(
                rotation.x,
                rotation.y,
                rotation.z
            );
// ============================================================
// ANIMACIÓN GLTF
// ============================================================

if (gltf.animations && gltf.animations.length > 0) {

    const mixer = new THREE.AnimationMixer(model);

    const action = mixer.clipAction(gltf.animations[0]);

    action.reset();
    action.play();

    mixers.push(mixer);

    console.log(
        `🎬 Animación encontrada en modelo ${index}:`,
        gltf.animations[0].name || "sin nombre"
    );

} else {

    console.log(
        `ℹ️ El modelo ${index} no contiene animaciones`
    );
}

            /* =================================================
               AGREGAR AL ANCHOR
               ================================================= */

            anchor.add(model);


            console.log(
                `✅ Modelo ${index} cargado correctamente: ${data.model}`
            );

        },


        /* =====================================================
           PROGRESO
           ===================================================== */

        (xhr) => {

            if (xhr.total) {

                const percent =
                    (xhr.loaded / xhr.total) * 100;

                console.log(
                    `📦 Hotspot ${index}: ${percent.toFixed(0)}%`
                );

            }

        },


        /* =====================================================
           ERROR
           ===================================================== */

        (error) => {

            console.error(
                `❌ ERROR cargando hotspot ${index}`
            );

            console.error(
                `📁 Archivo: ${data.model}`
            );

            console.error(
                error
            );

        }

    );
}

function updateHotspots() {

    hotspots.forEach((hotspot, index) => {

        const element = hotspotElements[index];

        if (!hotspot || !element) return;

        const position = new THREE.Vector3();

        hotspot.getWorldPosition(position);
        position.project(camera);

        const x =
            (position.x * 0.5 + 0.5) *
            window.innerWidth;

        const y =
            (-position.y * 0.5 + 0.5) *
            window.innerHeight;

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        // Si estamos haciendo fade o la cámara está enfocada,
        // NO modificamos opacity aquí.
        if (hotspotsFading || isCameraFocused) {
            element.style.pointerEvents = "none";
            return;
        }

        const visible =
            position.z < 1 &&
            position.x > -1.15 &&
            position.x < 1.15 &&
            position.y > -1.15 &&
            position.y < 1.15;

        //element.style.opacity = visible ? "1" : "0";

        element.style.pointerEvents =
            visible ? "auto" : "none";
    });
}


/* ============================================================
   CAMERA / INTERACTION
   ============================================================ */

function getModelUnderPointer(event) {
    if (!isCameraFocused || state.currentHotspot === null) return null;

    const rect = renderer.domElement.getBoundingClientRect();

    modelPointer.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

    modelPointer.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

    modelRaycaster.setFromCamera(modelPointer, camera);

    const parent = hotspotParents[state.currentHotspot];
    if (!parent) return null;

    const anchor = parent.getObjectByName(
        `interactiveController_${state.currentHotspot}`
    );

    if (!anchor) return null;

    const model = anchor.getObjectByName(
        `controller_${state.currentHotspot}`
    );

    if (!model) return null;

    const hits = modelRaycaster.intersectObject(model, true);

    return hits.length ? model : null;
}

function onPointerDown(event) {

    if (event.button !== undefined && event.button !== 0) return;

    // Cuando estamos enfocados, el mouse sobre el modelo rota el modelo
    // en lugar de mover la cámara.
    if (isCameraFocused) {

        const model = getModelUnderPointer(event);

        if (model) {
            rotatingModel = model;
            rotatingModelStartX = event.clientX;
            rotatingModelStartY = event.clientY;
            rotatingModelBaseY =
                model.userData.interactiveRotationY ?? 0;

            renderer.domElement.setPointerCapture?.(event.pointerId);
            renderer.domElement.style.cursor = "ew-resize";
            hideInstructions();
        }

        return;
    }

    isDragging = true;
    previousMouse.x = event.clientX;
    previousMouse.y = event.clientY;

    renderer.domElement.setPointerCapture?.(event.pointerId);
    renderer.domElement.style.cursor = "grabbing";

    hideInstructions();
}

function onPointerMove(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Rotación directa del modelo 3D
    if (rotatingModel) {

        const dx = event.clientX - rotatingModelStartX;
        const dy = event.clientY - rotatingModelStartY;

        rotatingModel.userData.interactiveRotationY =
            rotatingModelBaseY + dx * 0.012;

        rotatingModel.userData.interactiveRotationX =
            THREE.MathUtils.clamp(
                -dy * 0.006,
                -0.45,
                0.45
            );

        return;
    }

    if (!isDragging) return;

    const dx = event.clientX - previousMouse.x;
    const dy = event.clientY - previousMouse.y;

    targetRotationY -= dx * 0.0035;
    targetRotationX -= dy * 0.002;

    targetRotationX =
        THREE.MathUtils.clamp(
            targetRotationX,
            -0.24,
            0.24
        );

    previousMouse.x = event.clientX;
    previousMouse.y = event.clientY;
}

function onPointerUp(event) {

    rotatingModel = null;
    isDragging = false;

    if (event?.pointerId !== undefined) {
        try {
            renderer.domElement.releasePointerCapture?.(
                event.pointerId
            );
        } catch (e) {}
    }

    renderer.domElement.style.cursor = "grab";
}

// El usuario no controla el zoom con la rueda.
// La profundidad solo cambia mediante botones/hotspots.
// El usuario no controla el zoom con la rueda.
// La profundidad solo cambia mediante botones/hotspots.
function onWheel(event) {
    event.preventDefault();
}

function updateCamera() {

    if (isCameraFocused) return;

    currentRotationY += (targetRotationY - currentRotationY) * 0.08;
    currentRotationX += (targetRotationX - currentRotationX) * 0.08;

    const distance = camera.userData.orbitDistance ?? 9.0;
    const horizontalDistance = Math.cos(currentRotationX) * distance;

    camera.position.x = cameraTarget.x + Math.sin(currentRotationY) * horizontalDistance;
    camera.position.z = cameraTarget.z + Math.cos(currentRotationY) * horizontalDistance;
    camera.position.y = cameraTarget.y + Math.sin(currentRotationX) * distance + 1.6;

    camera.lookAt(cameraTarget);
}

/* ============================================================
   HOTSPOTS — VISIBILIDAD
   ============================================================ */

function setHotspotsVisible(visible) {

    hotspotsVisible = visible;

    hotspotElements.forEach((element) => {

        if (!element) return;

        if (visible) {

            element.style.opacity = "1";
            element.style.pointerEvents = "auto";

        } else {

            element.style.opacity = "0";
            element.style.pointerEvents = "none";

        }

    });
}


/* ============================================================
   HOTSPOTS — FADE
   ============================================================ */

/* ============================================================
   HOTSPOTS — FADE OUT
   ============================================================ */

function hideHotspots() {

    hotspotsFading = true;

    hotspotElements.forEach(element => {

        element.style.pointerEvents = "none";

        gsap.to(element, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.inOut"
        });

    });
}


/* ============================================================
   HOTSPOTS — FADE IN
   ============================================================ */

function showHotspots() {

    // Primero dejamos todos invisibles
    // mientras calculamos cuáles corresponden.
    hotspotElements.forEach(element => {

        element.style.opacity = "0";
        element.style.pointerEvents = "none";

    });

    hotspotsFading = false;

    // Esperamos un frame para que las posiciones
    // se hayan actualizado correctamente.
    requestAnimationFrame(() => {

        hotspots.forEach((hotspot, index) => {

            const element = hotspotElements[index];

            if (!hotspot || !element) return;

            const position = new THREE.Vector3();

            hotspot.getWorldPosition(position);
            position.project(camera);

            const visible =
                position.z < 1 &&
                position.x > -1.15 &&
                position.x < 1.15 &&
                position.y > -1.15 &&
                position.y < 1.15;

            if (!visible) return;

            element.style.pointerEvents = "auto";

            gsap.to(element, {
                opacity: 1,
                duration: 0.6,
                ease: "power2.inOut"
            });

        });

    });
}
/*
 * Enfoca la cámara EN LA POSICIÓN REAL del hotspot.
 * Como el hotspot es hijo del cubo, getWorldPosition() garantiza que
 * el punto de enfoque siga a la geometría incluso mientras el mundo gira.
 */
function focusCameraOnHotspot(id) {

    const hotspot = hotspots[id];

    if (!hotspot || !camera) return;

    // =========================================================
    // OCULTAR TODOS LOS HOTSPOTS
    // =========================================================
    setHotspotsVisible(false);

    const hotspotWorldPosition = new THREE.Vector3();


    hotspot.getWorldPosition(hotspotWorldPosition);

    // Conserva el encuadre original al cambiar de experiencia desde móvil.
    // Así cada swipe no guarda como "original" la cámara ya acercada.
    if (!savedCameraState) {
        savedCameraState = {
            position: camera.position.clone(),
            target: cameraTarget.clone(),
            rotationY: targetRotationY,
            rotationX: targetRotationX,
            orbitDistance: camera.userData.orbitDistance ?? 9.0
        };
    }

    isCameraFocused = true;
    isDragging = false;

    hideHotspots();

    if (focusTween) {
        focusTween.kill();
    }

    const direction = new THREE.Vector3()
        .subVectors(
            camera.position,
            hotspotWorldPosition
        )
        .normalize();

    const focusDistance = 4.6;

    const destination =
        hotspotWorldPosition.clone()
            .add(
                direction.multiplyScalar(
                    focusDistance
                )
            );

    destination.y += 0.65;

    // Elevamos ligeramente el punto de mirada para que el modelo
    // completo quede mejor encuadrado durante el zoom.
    const lookTarget =
        hotspotWorldPosition.clone();
    lookTarget.y += window.matchMedia("(max-width: 800px)").matches ? 1.45 : 0.55;

    const proxy = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,

        tx: cameraTarget.x,
        ty: cameraTarget.y,
        tz: cameraTarget.z
    };

    focusTween = gsap.to(proxy, {

        x: destination.x,
        y: destination.y,
        z: destination.z,

        tx: lookTarget.x,
        ty: lookTarget.y,
        tz: lookTarget.z,

        duration: 1.15,

        ease: "power3.inOut",

        onUpdate: () => {

            camera.position.set(
                proxy.x,
                proxy.y,
                proxy.z
            );

            cameraTarget.set(
                proxy.tx,
                proxy.ty,
                proxy.tz
            );

            camera.lookAt(
                cameraTarget
            );
        }

    });
}

function restoreCamera() {

    if (!camera || !savedCameraState) return;

    if (focusTween) {

        focusTween.kill();
        focusTween = null;

    }

    const saved = savedCameraState;

    const proxy = {

        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,

        tx: cameraTarget.x,
        ty: cameraTarget.y,
        tz: cameraTarget.z

    };

    // =========================================================
    // MANTENER EL FOCUS DURANTE TODO EL REGRESO
    // =========================================================

    isCameraFocused = true;

    focusTween = gsap.to(proxy, {

        x: saved.position.x,
        y: saved.position.y,
        z: saved.position.z,

        tx: saved.target.x,
        ty: saved.target.y,
        tz: saved.target.z,

        duration: 0.9,

        ease: "power3.inOut",

        onUpdate: () => {

            camera.position.set(
                proxy.x,
                proxy.y,
                proxy.z
            );

            cameraTarget.set(
                proxy.tx,
                proxy.ty,
                proxy.tz
            );

            camera.lookAt(
                cameraTarget
            );

        },

onComplete: () => {

    targetRotationY = saved.rotationY;
    targetRotationX = saved.rotationX;

    currentRotationY = saved.rotationY;
    currentRotationX = saved.rotationX;

    camera.userData.orbitDistance =
        saved.orbitDistance;

    // Ahora que la cámara terminó de regresar,
    // liberamos el modo focus.
    isCameraFocused = false;

    savedCameraState = null;
    focusTween = null;

    // Fade IN de los hotspots
    showHotspots();
}

    });
}


/* ============================================================
   ANIMATION
   ============================================================ */

function animate() {

    

    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;
    // ============================================================
// ACTUALIZAR ANIMACIONES GLTF
// ============================================================

mixers.forEach((mixer) => {
    mixer.update(delta);
});

    if (world) {
        floatingBackgroundObjects.forEach((object) => {

    const speed = object.userData.floatSpeed;
    const offset = object.userData.floatOffset;

    // Movimiento vertical muy suave
    object.position.y =
        object.userData.baseY +
        Math.sin(elapsed * speed + offset) * 0.7;

    // Pequeño desplazamiento lateral
    object.position.x =
        object.userData.baseX +
        Math.sin(elapsed * speed * 0.35 + offset) * 0.25;

    object.position.z =
        object.userData.baseZ +
        Math.cos(elapsed * speed * 0.3 + offset) * 0.25;

    // Rotación lenta
    object.rotation.x += object.userData.rotationX;
    object.rotation.y += object.userData.rotationY;
    object.rotation.z += object.userData.rotationZ;
});

        // Detenemos la rotación durante el focus para que la cámara
        // permanezca perfectamente dirigida al cubo seleccionado.
        // La sala permanece fija; la cámara es la que recorre el espacio.
        world.rotation.y = 0;

        // Núcleo central eliminado: no se anima ninguna esfera aquí.

        hotspotData.forEach((data, index) => {

    const parent =
        hotspotParents[index];

    if (!parent) return;

    const anchor =
        parent.getObjectByName(
            `interactiveController_${index}`
        );

    if (!anchor) return;

    const model =
        anchor.getObjectByName(
            `controller_${index}`
        );

    if (!model) return;


    // =========================================================
    // POSICIÓN BASE
    // =========================================================

    const basePosition =
        data.modelPosition ?? {
            x: 0,
            y: 0,
            z: 0
        };


    // =========================================================
    // FLOTACIÓN
    // =========================================================

    model.position.y =
        basePosition.y +
        Math.sin(
            elapsed * 1.6 +
            index * 0.8
        ) * 0.10;


    // =========================================================
    // ROTACIÓN
    // =========================================================

    const baseRotation =
        data.modelRotation ?? {
            x: 0,
            y: 0,
            z: 0
        };


    model.rotation.y =
        baseRotation.y +
        elapsed * 0.35 +
        (model.userData.interactiveRotationY ?? 0);


    model.rotation.x =
        baseRotation.x +
        (model.userData.interactiveRotationX ?? 0);

    model.rotation.z =
        baseRotation.z +
        Math.sin(
            elapsed * 1.2 +
            index
        ) * 0.04;
        });

        // ========================================================
        // ANIMACIÓN DE LAS PLATAFORMAS DE PRODUCTO
        // ========================================================

        hotspotData.forEach((data, index) => {

            const parent = hotspotParents[index];
            if (!parent) return;

            const presentation = parent.getObjectByName(
                `productPresentation_${index}`
            );

            if (!presentation) return;

            const glow = presentation.userData.glow;

            const phase = elapsed * 1.4 + index * 0.65;
            const pulse = (Math.sin(phase) + 1) * 0.5;

            if (glow) {
                glow.material.opacity = 0.12 + pulse * 0.10;
                glow.scale.setScalar(0.92 + pulse * 0.08);
            }


        });

    }

    // ============================================================
    // ANIMACIÓN DEL POLVO
    // Movimiento lento, irregular y casi imperceptible.
    // ============================================================
    if (dustParticles) {

        const positions =
            dustParticles.geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {

            const particleIndex = i / 3;

            positions[i] +=
                Math.sin(elapsed * 0.18 + particleIndex) * 0.00035;

            positions[i + 1] +=
                0.00045 +
                Math.sin(elapsed * 0.55 + particleIndex * 0.37) * 0.00022;

            positions[i + 2] +=
                Math.cos(elapsed * 0.16 + particleIndex * 0.71) * 0.00025;

            // Reaparece abajo cuando abandona el volumen.
            if (positions[i + 1] > 9.4) {
                positions[i + 1] = 0.4;
            }
        }

        dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    updateCamera();
    updateHotspots();

    composer.render();

}

/* ============================================================
   INFO PANEL
   ============================================================ */

function openInfo(id) {

    const data = hotspotData[id];

    if (!data) return;

    state.currentHotspot = id;

    infoNumber.textContent = data.number;
    infoCategory.textContent = data.category;
    infoTitle.textContent = data.title;
    infoDescription.textContent = data.description;

    closeAllOverlays();

    gsap.to(infoPanel, {
        autoAlpha: 1,
        x: 0,
        duration: .55,
        ease: "power3.out"
    });

    updateProgress(id);
    updateMobileExperienceDots();
}

function closeInfoPanel() {

    closeGalleryPanel();

    gsap.to(infoPanel, {
        autoAlpha: 0,
        x: 35,
        duration: .35,
        ease: "power2.in"
    });

    state.currentHotspot = null;

    // Al cerrar el popup, volvemos suavemente al encuadre exacto anterior.
    restoreCamera();
}

function updateProgress(id) {

    const progress = ((id + 1) / hotspotData.length) * 100;

    gsap.to(progressBar, {
        width: `${progress}%`,
        duration: .7,
        ease: "power2.out"
    });
}

/* ============================================================
   OVERLAYS
   ============================================================ */

function openOverlay(element) {

    closeAllOverlays();

    element.style.display = "block";

    gsap.fromTo(
        element,
        {
            autoAlpha: 0
        },
        {
            autoAlpha: 1,
            duration: .45,
            ease: "power2.out"
        }
    );
}

function closeOverlay(element) {

    gsap.to(element, {
        autoAlpha: 0,
        duration: .3,
        ease: "power2.in",
        onComplete: () => {
            element.style.display = "none";
        }
    });
}

function closeAllOverlays() {

    [mapOverlay, chaptersOverlay, menuOverlay, contactOverlay].forEach(overlay => {

        if (overlay.style.display !== "none") {

            overlay.style.display = "none";
        }
    });
}

/* ============================================================
   INTRO
   ============================================================ */

function startExperience() {

    if (state.experienceStarted) return;

    state.experienceStarted = true;

    gsap.timeline()
        .to(intro, {
            autoAlpha: 0,
            duration: 1.1,
            ease: "power3.inOut"
        })
        .set(intro, {
            display: "none"
        })
        .set(experience, {
            visibility: "visible"
        })
        .to(experience, {
            autoAlpha: 1,
            duration: .8,
            ease: "power2.out",
            onComplete: () => {
                if (window.matchMedia("(max-width: 800px)").matches) {
                    hideInstructions();
                    openInfo(0);
                    focusCameraOnHotspot(0);
                }
            }
        });
}

function goHome() {

    closeInfoPanel();
    closeAllOverlays();

    
    gsap.set(intro, {
        display: "flex",
        autoAlpha: 1
    });

    gsap.set(experience, {
        autoAlpha: 0
    });

    experience.style.visibility = "hidden";

    state.experienceStarted = false;
}

/* ============================================================
   GALERÍA
   ============================================================ */

const gallerySets = [
    [
        ["./assets/gallery/360-1.png", "VIDEO 360° — INMERSIÓN"],
        ["./assets/gallery/360-2.png", "VIDEO 360° — ESCENA"],
        ["./assets/gallery/360-3.png", "VIDEO 360° — EXPERIENCIA"]
    ],
    [
        ["./assets/gallery/vr-1.png", "REALIDAD VIRTUAL — SIMULACIÓN"],
        ["./assets/gallery/vr-2.png", "REALIDAD VIRTUAL — PRÁCTICA"],
        ["./assets/gallery/vr-3.png", "REALIDAD VIRTUAL — ENTORNO"]
    ],
    [
        ["./assets/gallery/interactivo-1.png", "INTERACTIVIDAD — EXPLORA"],
        ["./assets/gallery/interactivo-2.png", "INTERACTIVIDAD — DESCUBRE"],
        ["./assets/gallery/interactivo-3.png", "INTERACTIVIDAD — DECIDE"]
    ],
    [
        ["./assets/gallery/gamificacion-1.png", "GAMIFICACIÓN — DESAFÍO"],
        ["./assets/gallery/gamificacion-2.png", "GAMIFICACIÓN — PROGRESIÓN"],
        ["./assets/gallery/gamificacion-3.png", "GAMIFICACIÓN — RECOMPENSA"]
    ],
    [
        ["./assets/gallery/team-1.png", "TEAM BUILDING — CONEXIÓN"],
        ["./assets/gallery/team-2.png", "TEAM BUILDING — COLABORACIÓN"],
        ["./assets/gallery/team-3.png", "TEAM BUILDING — EQUIPO"]
    ]
];

function openGallery() {
    const id = state.currentHotspot;
    if (id === null || !galleryPanel) return;

    galleryImages = gallerySets[id] || gallerySets[0];
    galleryIndex = 0;

    renderGallery();

    galleryPanel.setAttribute("aria-hidden", "false");
    galleryPanel.classList.add("is-open");
    infoPanel.classList.add("gallery-open");

    gsap.fromTo(galleryPanel,
        { autoAlpha: 0, x: -30 },
        { autoAlpha: 1, x: 0, duration: 0.55, ease: "power3.out" }
    );

    gsap.to(infoPanel, {
        x: 0,
        duration: 0.55,
        ease: "power3.out"
    });
}

function closeGalleryPanel() {
    
    if (!galleryPanel) return;

    galleryPanel.setAttribute("aria-hidden", "true");
    galleryPanel.classList.remove("is-open");
    infoPanel.classList.remove("gallery-open");

    gsap.to(galleryPanel, {
        autoAlpha: 0,
        x: -25,
        duration: 0.35,
        ease: "power2.in"
    });
}

function renderGallery() {
    if (!galleryImages.length) return;

    const current = galleryImages[galleryIndex];
    galleryMainImage.src = current[0];
    galleryMainImage.alt = current[1];
    galleryMainTitle.textContent = `IMAGEN ${String(galleryIndex + 1).padStart(2, "0")}`;
    galleryCounter.textContent = `${String(galleryIndex + 1).padStart(2, "0")} / ${String(galleryImages.length).padStart(2, "0")}`;

    galleryThumbs.innerHTML = galleryImages.map((image, index) => `
        <button class="gallery-thumb ${index === galleryIndex ? "active" : ""}" data-gallery-index="${index}" aria-label="Ver imagen ${index + 1}">
            <img src="${image[0]}" alt="${image[1]}" />
            <span>${String(index + 1).padStart(2, "0")}</span>
        </button>
    `).join("");

    galleryThumbs.querySelectorAll(".gallery-thumb").forEach(button => {
        button.addEventListener("click", () => {
            galleryIndex = Number(button.dataset.galleryIndex);
            renderGallery();
        });
    });
}

function galleryStep(direction) {
    if (!galleryImages.length) return;
    galleryIndex = (galleryIndex + direction + galleryImages.length) % galleryImages.length;
    renderGallery();
}

function openContactPanel() {
    if (!contactOverlay) return;

    closeAllOverlays();

    contactOverlay.style.display = "block";
    contactOverlay.setAttribute("aria-hidden", "false");

    gsap.fromTo(
        contactOverlay,
        { autoAlpha: 0 },
        {
            autoAlpha: 1,
            duration: 0.45,
            ease: "power2.out"
        }
    );
}

function closeContactPanel() {
    if (!contactOverlay) return;

    contactOverlay.setAttribute("aria-hidden", "true");

    gsap.to(contactOverlay, {
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            contactOverlay.style.display = "none";
        }
    });
}

/* ============================================================
   MENU
   ============================================================ */

/* ============================================================
   NAVEGACIÓN MÓVIL ENTRE EXPERIENCIAS
   Swipe horizontal + botones accesibles.
   ============================================================ */

const mobilePrevExperience = document.getElementById("mobilePrevExperience");
const mobileNextExperience = document.getElementById("mobileNextExperience");
const mobileExperienceDots = document.getElementById("mobileExperienceDots");

function buildMobileExperienceDots() {
    if (!mobileExperienceDots) return;
    mobileExperienceDots.innerHTML = "";
    hotspotData.forEach((item, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "mobile-experience-dot";
        dot.setAttribute("aria-label", `Ir a ${item.title}`);
        dot.addEventListener("click", () => navigateMobileExperience(index));
        mobileExperienceDots.appendChild(dot);
    });
    updateMobileExperienceDots();
}

function updateMobileExperienceDots() {
    if (!mobileExperienceDots) return;
    [...mobileExperienceDots.children].forEach((dot, index) => {
        dot.classList.toggle("active", index === state.currentHotspot);
        dot.setAttribute("aria-current", index === state.currentHotspot ? "step" : "false");
    });
}

function navigateMobileExperience(nextIndex) {
    if (!window.matchMedia("(max-width: 800px)").matches) return;
    if (galleryPanel?.classList.contains("is-open")) return;

    const index = (nextIndex + hotspotData.length) % hotspotData.length;
    closeAllOverlays();

    if (state.currentHotspot === null || !savedCameraState) {
        openInfo(index);
        focusCameraOnHotspot(index);
        hideInstructions();
        return;
    }

    if (focusTween) focusTween.kill();
    openInfo(index);
    focusCameraOnHotspot(index);
    updateMobileExperienceDots();
}

function setupMobileExperienceNavigation() {
    buildMobileExperienceDots();

    mobilePrevExperience?.addEventListener("click", () => {
        navigateMobileExperience((state.currentHotspot ?? 0) - 1);
    });
    mobileNextExperience?.addEventListener("click", () => {
        navigateMobileExperience((state.currentHotspot ?? -1) + 1);
    });

    let startX = 0;
    let startY = 0;
    let tracking = false;

    experience.addEventListener("touchstart", (event) => {
        if (!window.matchMedia("(max-width: 800px)").matches) return;
        if (event.touches.length !== 1) return;
        const target = event.target;
        if (target.closest("button, a, input, textarea, .gallery-panel, .overlay-panel, .menu-overlay")) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        tracking = true;
    }, { passive: true });

    experience.addEventListener("touchend", (event) => {
        if (!tracking || !window.matchMedia("(max-width: 800px)").matches) return;
        tracking = false;
        if (!event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - startX;
        const dy = event.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

        if (galleryPanel?.classList.contains("is-open")) return;
        navigateMobileExperience((state.currentHotspot ?? 0) + (dx < 0 ? 1 : -1));
    }, { passive: true });
}

function setupMenu() {

    setupMobileExperienceNavigation();

    startButton.addEventListener("click", startExperience);

    homeButton.addEventListener("click", goHome);

    closeInfo.addEventListener("click", closeInfoPanel);

    mapButton.addEventListener("click", () => {
        openOverlay(mapOverlay);
    });

    chaptersButton.addEventListener("click", () => {
        openOverlay(chaptersOverlay);
    });

    menuButton.addEventListener("click", () => {
        openOverlay(menuOverlay);
    });

    document.querySelectorAll("[data-close-overlay]").forEach(button => {

        button.addEventListener("click", () => {

            const parent = button.closest(".overlay-panel, .menu-overlay");

            closeOverlay(parent);
        });
    });

    document.querySelectorAll("[data-hotspot]").forEach(button => {

        button.addEventListener("click", () => {

            const id = Number(button.dataset.hotspot);

            closeAllOverlays();

            focusHotspot(id);
        });
    });

    document.querySelectorAll("[data-menu-target]").forEach(button => {

        button.addEventListener("click", () => {

            const target = document.getElementById(
                button.dataset.menuTarget
            );

            openOverlay(target);
        });
    });

    document.getElementById("menuContact").addEventListener(
        "click",
        openContactPanel
    );

    document.getElementById("infoContactAction")?.addEventListener(
        "click",
        openContactPanel
    );

    document.getElementById("infoAction").addEventListener(
        "click",
        () => {
            openGallery();
        }
    );

    closeContact?.addEventListener("click", closeContactPanel);
    document.getElementById("footerContact")?.addEventListener(
        "click",
        openContactPanel
    );

    closeGallery.addEventListener("click", closeGalleryPanel);
    galleryPrev.addEventListener("click", () => galleryStep(-1));
    galleryNext.addEventListener("click", () => galleryStep(1));

    document.addEventListener("keydown", event => {
        if (!galleryPanel.classList.contains("is-open")) return;
        if (event.key === "Escape") closeGalleryPanel();
        if (event.key === "ArrowLeft") galleryStep(-1);
        if (event.key === "ArrowRight") galleryStep(1);
    });
}

/* ============================================================
   FOCUS HOTSPOT
   ============================================================ */

function focusHotspot(id) {

    const data = hotspotData[id];

    if (!data) return;

    // El click abre contenido y es la única acción que puede acercar la cámara.
    focusCameraOnHotspot(id);
    openInfo(id);
}

/* ============================================================
   INSTRUCTIONS
   ============================================================ */

function hideInstructions() {

    gsap.to(instructions, {
        autoAlpha: 0,
        duration: .35
    });
}

/* ============================================================
   RESIZE
   ============================================================ */

function onResize() {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    }

    if (bloomPass) {
        bloomPass.setSize(window.innerWidth, window.innerHeight);
    }
}

/* ============================================================
   INIT
   ============================================================ */

initThree();
setupMenu();

renderer.domElement.style.cursor = "grab";
