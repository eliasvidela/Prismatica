import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ============================================================
// CARGADOR DE MODELOS 3D
// Todos los modelos .glb/.gltf interactivos se cargan mediante
// esta instancia.
//
// PARA CAMBIAR LOS MODELOS:
// modifica las rutas dentro de hotspotData.
// ============================================================
const controllerLoader = new GLTFLoader();

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
        title: "Video 360°",
        description: "Explora situaciones reales desde cualquier ángulo y transporta al participante directamente al lugar donde ocurre el aprendizaje.",
        label: "VIDEO 360°",

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
        description: "Creamos experiencias para dispositivos como Meta Quest que permiten practicar situaciones complejas dentro de un entorno seguro y controlado.",
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
        description: "Transformamos contenidos estáticos en espacios digitales donde el participante puede explorar, descubrir información y tomar decisiones.",
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
        description: "Incorporamos desafíos, progresión, recompensas y decisiones para convertir el aprendizaje en una experiencia activa.",
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
        category: "EQUIPO",
        title: "Team Building",
        description: "Fortalecemos tu equipo de trabajo con experiencias inolvidables. Diseñamos la interacción y la tecnología alrededor de ese propósito.",
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

    scene.background = new THREE.Color(0xf3b8ab);
   
    scene.fog = new THREE.FogExp2(0xe7aaa0, 0.010);

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    document.getElementById("canvas-container").appendChild(renderer.domElement);

    composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
ssaoPass.minDistance = 0.005;    // Distancia mínima para que actúe
ssaoPass.maxDistance = 0.5;      // Distancia máxima de alcance
composer.addPass(ssaoPass);

// 4. Asegura la salida de color correcta en pantalla (Gamma/Linear)
const outputPass = new OutputPass();
composer.addPass(outputPass);

    clock = new THREE.Clock();

    createLights();
createWorld();
createHotspots();

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
    // SALA LIMINAL — PALETA CÁLIDA / ROJO CORAL / CREMA
    // Inspirada en el lenguaje visual de Superliminal:
    // espacios limpios, cálidos, surrealistas y muy legibles.
    // ============================================================

    world = new THREE.Group();
    scene.add(world);

    const ROOM_W = 0;
    const ROOM_D = 0;
    const ROOM_H = 0;
    const WALL = 0;

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xd98778,
        roughness: 0.78,
        metalness: 0.0,
        side: THREE.DoubleSide
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0xf3d4c9,
        roughness: 0.82,
        side: THREE.DoubleSide
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8f3d3a,
        roughness: 0.95,
        side: THREE.DoubleSide
    });

    // ------------------------------------------------------------
    // PISO
    // ------------------------------------------------------------
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_W, 0.35, ROOM_D),
        floorMaterial
    );
    floor.position.set(0, -0.25, 0);
    floor.rotation.set(4.7,0,0)
    floor.receiveShadow = true;
    world.add(floor);

    // Alfombra central: mantiene la lectura de "sala de exhibición".
    const carpet = new THREE.Mesh(
        new THREE.SphereGeometry(50, 5,5),
        new THREE.MeshStandardMaterial({
            color: 0xcf3131,
            side: THREE.DoubleSide,
            roughness: 1.0,
            metalness: 0
        })
    );
    carpet.position.set(0, -0.045, 0.4);
    carpet.receiveShadow = true;
    world.add(carpet);


    // Alfombra central: mantiene la lectura de "sala de exhibición".
    const piso = new THREE.Mesh(
        new THREE.CircleGeometry( 10, 32 ),
        new THREE.MeshStandardMaterial({
            color: 0x9d242c,
            roughness: 1.0,
            metalness: 0
        })
    );
  
    piso.rotation.set(4.71239,0,0);
    piso.receiveShadow = true;
    world.add(piso);

    // ------------------------------------------------------------
    // CUATRO PAREDES + TECHO
    // ------------------------------------------------------------
    const wallDefs = [
        [0, ROOM_H / 2, -ROOM_D / 2, ROOM_W, ROOM_H, WALL], // fondo
        [0, ROOM_H / 2,  ROOM_D / 2, ROOM_W, ROOM_H, WALL], // frente
        [-ROOM_W / 2, ROOM_H / 2, 0, WALL, ROOM_H, ROOM_D], // izquierda
        [ ROOM_W / 2, ROOM_H / 2, 0, WALL, ROOM_H, ROOM_D]  // derecha
    ];

    wallDefs.forEach(([x, y, z, w, h, d]) => {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            wallMaterial
        );
        wall.position.set(x, y, z);
        wall.receiveShadow = true;
        world.add(wall);
    });

    const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_W, 0.35, ROOM_D),
        ceilingMaterial
    );
    ceiling.position.y = ROOM_H;
    ceiling.receiveShadow = true;
    world.add(ceiling);

    // ------------------------------------------------------------
    // MOLDURAS / ZÓCALOS
    // ------------------------------------------------------------
    const trimMaterial = new THREE.MeshStandardMaterial({
        color: 0xf1d8cf,
        roughness: 0.65,
        metalness: 0.0
    });

    const addTrim = (x, y, z, w, h, d) => {
        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            trimMaterial
        );
        trim.position.set(x, y, z);
        world.add(trim);
    };
    // Zócalos
    addTrim(0, 0.18, -ROOM_D / 2 + 0.18, ROOM_W, 0.36, 0.12);
    addTrim(0, 0.18,  ROOM_D / 2 - 0.18, ROOM_W, 0.36, 0.12);
    addTrim(-ROOM_W / 2 + 0.18, 0.18, 0, 0.12, 0.36, ROOM_D);
    addTrim( ROOM_W / 2 - 0.18, 0.18, 0, 0.12, 0.36, ROOM_D);

    // Moldura superior
    addTrim(0, ROOM_H - 0.30, -ROOM_D / 2 + 0.18, ROOM_W, 0.28, 0.18);
    addTrim(0, ROOM_H - 0.30,  ROOM_D / 2 - 0.18, ROOM_W, 0.28, 0.18);
    addTrim(-ROOM_W / 2 + 0.18, ROOM_H - 0.30, 0, 0.18, 0.28, ROOM_D);
    addTrim( ROOM_W / 2 - 0.18, ROOM_H - 0.30, 0, 0.18, 0.28, ROOM_D);

    // Paneles bajos muy sutiles para dar profundidad a las paredes.
    const lowerPanelMaterial = new THREE.MeshStandardMaterial({
        color: 0xc96f64,
        roughness: 0.82,
        metalness: 0
    });

    const addPanelBand = (x, y, z, w, h, d) => {
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            lowerPanelMaterial
        );
        panel.position.set(x, y, z);
        panel.receiveShadow = true;
        world.add(panel);
    };

    addPanelBand(0, 1.65, -ROOM_D / 2 + 0.17, ROOM_W - 0.8, 0.035, 0.035);
    addPanelBand(0, 1.65,  ROOM_D / 2 - 0.17, ROOM_W - 0.8, 0.035, 0.035);
    addPanelBand(-ROOM_W / 2 + 0.17, 1.65, 0, 0.035, 0.035, ROOM_D - 0.8);
    addPanelBand( ROOM_W / 2 - 0.17, 1.65, 0, 0.035, 0.035, ROOM_D - 0.8);

    // ------------------------------------------------------------
    // LÁMPARA CENTRAL
    // ------------------------------------------------------------
    const pendant = new THREE.Group();
    pendant.name = "pendantLight";
    pendant.position.set(0, ROOM_H - 0.15, -0.5);
    world.add(pendant);

    const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.25, 12),
        new THREE.MeshStandardMaterial({ color: 0x9a4c43, roughness: 0.7 })
    );
    cable.position.y = -0.62;
    pendant.add(cable);

    const lampShade = new THREE.Mesh(
        new THREE.SphereGeometry(0.82, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
        new THREE.MeshStandardMaterial({
            color: 0xfff3e9,
            emissive: 0xffd7c5,
            emissiveIntensity: 1.6,
            roughness: 0.25
        })
    );
    lampShade.rotation.x = Math.PI;
    lampShade.position.y = -1.22;
    pendant.add(lampShade);

    const lampLight = new THREE.PointLight(0xffd0be, 18, 20, 2);
    lampLight.position.y = -1.35;
    pendant.add(lampLight);

    // ------------------------------------------------------------
    // NÚCLEO CENTRAL ELIMINADO
    // La sala queda despejada para priorizar la lectura de los
    // cinco pedestales y sus modelos 3D.
    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // CINCO PEDESTALES — AHORA SON CUBOS
    // El hotspot y el modelo 3D se anclan directamente a cada cubo.
    // ============================================================
    // PARA CAMBIAR EL DISEÑO DE LOS PEDESTALES:
    // modifica solo width / height / depth aquí.
    // ============================================================
    const cubeDefinitions = [
        [-6.0, 1.45, -2.9, 2.9, 2.9, 2.9], // 01 Video 360
        [ 6.0, 1.45, -2.9, 2.9, 2.9, 2.9], // 02 Realidad Virtual
        [ 0.0, 1.45, -6.2, 2.9, 2.9, 2.9], // 03 Interactividad
        [-5.6, 1.45,  4.1, 2.9, 2.9, 2.9], // 04 Gamificación
        [ 5.6, 1.45,  4.1, 2.9, 2.9, 2.9]  // 05 Team Building
    ];

    cubeDefinitions.forEach((definition, index) => {
        const cube = createStructure(...definition);
        cube.userData.hotspotId = index;
        hotspotParents[index] = cube;
    });
}

function createStarField() {

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    const starColors = [
        new THREE.Color(0xfff8f2),
        new THREE.Color(0xffd8cf),
        new THREE.Color(0xffc0b0),
        new THREE.Color(0xffe5c9)
    ];

    for (let i = 0; i < 3200; i++) {
        const radius = 25 + Math.random() * 65;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions.push(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );

        const c = starColors[Math.floor(Math.random() * starColors.length)];
        colors.push(c.r, c.g, c.b);
        sizes.push(0.02 + Math.random() * 0.06);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = "starField";
    scene.add(stars);
}

function createNebula() {

    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const ctx = textureCanvas.getContext("2d");

    const gradient = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    gradient.addColorStop(0, "rgba(90, 210, 255, 0.22)");
    gradient.addColorStop(0.35, "rgba(76, 95, 255, 0.11)");
    gradient.addColorStop(0.72, "rgba(175, 70, 255, 0.035)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const positions = [
        [-22, 8, -35, 28, 18, -0.25],
        [24, -2, -45, 35, 22, 0.5],
        [-30, -10, 10, 30, 20, 0.1]
    ];

    positions.forEach((p, i) => {
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(p[0], p[1], p[2]);
        sprite.scale.set(p[3], p[4], 1);
        sprite.material.rotation = p[5];
        sprite.name = `nebula_${i}`;
        scene.add(sprite);
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
        roughness: 1.48,
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

function onPointerDown(event) {

    if (event.button !== undefined && event.button !== 0) return;

    // Mientras la cámara está enfocada en un hotspot, el recorrido
    // está bloqueado para mantener la lectura visual del popup.
    if (isCameraFocused) return;

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

    if (!isDragging) return;

    const dx = event.clientX - previousMouse.x;
    const dy = event.clientY - previousMouse.y;

    // Solo órbita horizontal + movimiento vertical.
    // No modificamos la profundidad durante el arrastre.
    targetRotationY -= dx * 0.0035;
    targetRotationX -= dy * 0.002;

    targetRotationX = THREE.MathUtils.clamp(targetRotationX, -0.24, 0.24);

    previousMouse.x = event.clientX;
    previousMouse.y = event.clientY;
}

function onPointerUp(event) {

    isDragging = false;

    if (event?.pointerId !== undefined) {
        try { renderer.domElement.releasePointerCapture?.(event.pointerId); } catch (e) {}
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

    savedCameraState = {
        position: camera.position.clone(),
        target: cameraTarget.clone(),
        rotationY: targetRotationY,
        rotationX: targetRotationX,
        orbitDistance: camera.userData.orbitDistance ?? 9.0
    };

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
    lookTarget.y += 0.55;

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
        elapsed * 0.35;


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

    [mapOverlay, chaptersOverlay, menuOverlay].forEach(overlay => {

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
            ease: "power2.out"
        });
}

function goHome() {

    closeInfoPanel();
    closeAllOverlays();

    if (camera) {
        if (focusTween) focusTween.kill();

        isCameraFocused = false;
        savedCameraState = null;

        camera.userData.orbitDistance = 9.0;
        targetRotationY = 0;
        targetRotationX = 0;
        currentRotationY = 0;
        currentRotationX = 0;
        cameraTarget.set(0, 2.25, 0);
        camera.position.set(0, 3.6, 9.0);
        camera.lookAt(cameraTarget);
    }

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
        ["./assets/gallery/360-1.jpg", "VIDEO 360° — INMERSIÓN"],
        ["./assets/gallery/360-2.jpg", "VIDEO 360° — ESCENA"],
        ["./assets/gallery/360-3.png", "VIDEO 360° — EXPERIENCIA"]
    ],
    [
        ["./assets/gallery/vr-01.svg", "REALIDAD VIRTUAL — SIMULACIÓN"],
        ["./assets/gallery/vr-02.svg", "REALIDAD VIRTUAL — PRÁCTICA"],
        ["./assets/gallery/vr-03.svg", "REALIDAD VIRTUAL — ENTORNO"]
    ],
    [
        ["./assets/gallery/interactividad-01.svg", "INTERACTIVIDAD — EXPLORA"],
        ["./assets/gallery/interactividad-02.svg", "INTERACTIVIDAD — DESCUBRE"],
        ["./assets/gallery/interactividad-03.svg", "INTERACTIVIDAD — DECIDE"]
    ],
    [
        ["./assets/gallery/gamificacion-01.svg", "GAMIFICACIÓN — DESAFÍO"],
        ["./assets/gallery/gamificacion-02.svg", "GAMIFICACIÓN — PROGRESIÓN"],
        ["./assets/gallery/gamificacion-03.svg", "GAMIFICACIÓN — RECOMPENSA"]
    ],
    [
        ["./assets/gallery/team-01.svg", "TEAM BUILDING — CONEXIÓN"],
        ["./assets/gallery/team-02.svg", "TEAM BUILDING — COLABORACIÓN"],
        ["./assets/gallery/team-03.svg", "TEAM BUILDING — EQUIPO"]
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

/* ============================================================
   MENU
   ============================================================ */

function setupMenu() {

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
        () => {
            alert("Aquí conectaremos posteriormente el formulario de contacto.");
        }
    );

    document.getElementById("infoAction").addEventListener(
        "click",
        () => {
            openGallery();
        }
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
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
