import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';
import Stats from 'stats.js';

/**
 * FPS Panel
 */
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

/**
 * Constants
 */
const parameters = {
    speed: 5,
    boundary: 15,
    floorHeight: -5,
    ceilHeight: 5,
    pillarWindow: 4,
    impulseValue: 25,
};

/**
 * Debug
 */
const gui = new dat.GUI();
gui.add(parameters, 'speed').min(0).max(10).step(1);
gui.add(parameters, 'boundary').min(5).max(20).step(1);
gui.add(parameters, 'floorHeight').min(-10).max(-5).step(1);
gui.add(parameters, 'ceilHeight').min(5).max(10).step(1);
gui.add(parameters, 'pillarWindow').min(0).max(10).step(1);
gui.add(parameters, 'impulseValue').min(10).max(50).step(1);

const stop = () => {
    bool = false;
};

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Models
 */
const gltfLoader = new GLTFLoader();
let birdGltfMesh = null;
let buildGltfMesh = null;
let cityMesh1 = null;
let cityMesh2 = null;
let mixer = null;
let helper = null;

gltfLoader.load('/models/crow/scene.gltf', (gltf) => {
    birdGltfMesh = gltf.scene;
    mixer = new THREE.AnimationMixer(birdGltfMesh);
    const action = mixer.clipAction(gltf.animations[0]);
    // action.setDuration(1);
    action.play();
    // action.startAt(-7);
    birdGltfMesh.scale.set(0.025, 0.025, 0.025);
    birdGltfMesh.rotation.y = Math.PI * 0.5;
    // console.log(birdMesh.position, birdGltfMesh.position);
    birdGltfMesh.castShadow = true;
    scene.add(birdGltfMesh);
});

// gltfLoader.load('/models/building2/buildings.glb', (gltf) => {
//     buildGltfMesh = gltf.scene;
//     buildGltfMesh.scale.set(2, 2, 2);
//     buildGltfMesh.position.z = -100;
//     buildGltfMesh.position.y = -50;
//     buildGltfMesh.rotation.y = Math.PI * 0.5;
//     buildGltfMesh.castShadow = true;
//     buildGltfMesh.children[0].castShadow = true;
//     buildGltfMesh.children[1].castShadow = true;
//     buildGltfMesh.children[1].children[0].castShadow = true;
//     buildGltfMesh.children[1].children[1].castShadow = true;
//     buildGltfMesh.children[1].children[2].castShadow = true;
//     buildGltfMesh.children[1].children[0].metalness = 1;
//     buildGltfMesh.children[1].children[0].metalness = 1;
//     buildGltfMesh.children[1].children[1].metalness = 1;
//     buildGltfMesh.children[1].children[1].roughness = 0;
//     buildGltfMesh.children[1].children[2].roughness = 0;
//     buildGltfMesh.children[1].children[2].roughness = 0;
//     buildGltfMesh.children[2].castShadow = true;
//     buildGltfMesh.children[3].castShadow = true;
//     buildGltfMesh.children[4].castShadow = true;
//     buildGltfMesh.children[5].castShadow = true;
//     buildGltfMesh.children[0].receiveShadow = true;
//     buildGltfMesh.children[1].receiveShadow = true;
//     buildGltfMesh.children[2].receiveShadow = true;
//     buildGltfMesh.children[3].receiveShadow = true;
//     scene.add(buildGltfMesh);
// });

// gltfLoader.load('/models/building3/untitled.glb', (gltf) => {
//     buildGltfMesh = gltf.scene;
//     // buildGltfMesh.scale.set(0.025, 0.025, 0.025);
//     buildGltfMesh.position.z = -200;
//     buildGltfMesh.position.y = -100;
//     // buildGltfMesh.castShadow = true;
//     scene.add(buildGltfMesh);
// });

// gltfLoader.load('/models/city/uploads_files_3630650_city.glb', (gltf) => {
//     cityMesh1 = gltf.scene;
//     cityMesh1.scale.set(10, 10, 10);
//     cityMesh1.position.z = -400;
//     // cityMesh1.castShadow = true;
//     scene.add(cityMesh1);
// });

// gltfLoader.load('/models/city/uploads_files_3630650_city.glb', (gltf) => {
//     cityMesh2 = gltf.scene;
//     cityMesh2.scale.set(10, 10, 10);
//     cityMesh2.position.z = -400;
//     cityMesh2.position.x = 600;
//     // cityMesh2.castShadow = true;
//     scene.add(cityMesh2);
// });

/**
 * Sounds
 */
const hitSound = new Audio('/sounds/hit.mp3');

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
    `/textures/environmentMaps/3/px.png`,
    `/textures/environmentMaps/3/nx.png`,
    `/textures/environmentMaps/3/py.png`,
    `/textures/environmentMaps/3/ny.png`,
    `/textures/environmentMaps/3/pz.png`,
    `/textures/environmentMaps/3/nz.png`,
]);

/**
 * Skybox
 */
const skyboxMaterial = [];
const skyboxTexture_ft = textureLoader.load('./textures/skybox/bay_ft.jpg');
const skyboxTexture_bk = textureLoader.load('./textures/skybox/bay_bk.jpg');
const skyboxTexture_up = textureLoader.load('./textures/skybox/bay_up.jpg');
const skyboxTexture_dn = textureLoader.load('./textures/skybox/bay_dn.jpg');
const skyboxTexture_rt = textureLoader.load('./textures/skybox/bay_rt.jpg');
const skyboxTexture_lt = textureLoader.load('./textures/skybox/bay_lf.jpg');
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_ft }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_bk }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_up }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_dn }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_rt }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_lt }));

for (let i = 0; i < skyboxMaterial.length; i++)
    skyboxMaterial[i].side = THREE.BackSide;

const skyboxGeometry = new THREE.BoxBufferGeometry(1500, 1500, 1500);
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);
skybox.position.y = -150;

/**
 * Physics
 */

// World
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -12, 0);

// Materials
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.4,
    }
);
world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

/**
 * Floor and Ceiling
 */

const planeShape = new CANNON.Plane();

const floorBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, parameters.floorHeight, 0),
    shape: planeShape,
});

const ceilBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, parameters.ceilHeight, 0),
    shape: planeShape,
});

floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
ceilBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.5);

world.addBody(floorBody);
world.addBody(ceilBody);

/**
 * Meshes
 */

const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 20),
    new THREE.MeshStandardMaterial({
        color: '#666666',
        metalness: 0.3,
        roughness: 0.4,
        // envMap: environmentMapTexture,
        envMapIntensity: 0.5,
    })
);
floorMesh.receiveShadow = true;
floorMesh.rotation.x = -Math.PI * 0.5;
floorMesh.position.set(0, parameters.floorHeight, 0);
scene.add(floorMesh);

const seaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 500),
    new THREE.MeshStandardMaterial({
        color: '#2266ff',
        metalness: 0.8,
        roughness: 0.2,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5,
    })
);
seaMesh.rotation.x = -Math.PI * 0.5;
seaMesh.position.set(0, parameters.floorHeight - 5, -100);
// scene.add(seaMesh);

const ceilMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 20, 20, 10),
    new THREE.MeshStandardMaterial({
        color: '#999922',
        metalness: 0.2,
        roughness: 0.8,
        wireframe: true,
    })
);
ceilMesh.rotation.x = Math.PI * 0.5;
ceilMesh.position.set(0, parameters.ceilHeight, 0);
scene.add(ceilMesh);

const buildingMesh = new THREE.Mesh(
    new THREE.BoxBufferGeometry(10, 20, 5),
    new THREE.MeshStandardMaterial({
        color: '#997777',
        metalness: 0.5,
        roughness: 0.5,
        envMap: environmentMapTexture,
        envMapIntensity: 0.6,
    })
);

buildingMesh.receiveShadow = true;
buildingMesh.position.set(parameters.boundary * 3, 0, -100);
scene.add(buildingMesh);

/**
 * Pillars
 */

// Three.js mesh

// Material
const pillarMaterial = new THREE.MeshStandardMaterial({
    color: '#747474',
    metalness: 0.7,
    roughness: 0.3,
    envMap: environmentMapTexture,
    envMapIntensity: 0.6,
});

// Geometry
let pillar1Geometry = null;
let pillar2Geometry = null;

// Mesh
let pillar1Mesh = null;
let pillar2Mesh = null;

// Cannon.js birdBody

// Body
const pillar1Body = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, 0),
    material: defaultMaterial,
});

const pillar2Body = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, 0),
    material: defaultMaterial,
});

// Shape
let pillar1Shape = null;
let pillar2Shape = null;

// Height
let pillar1Height = 0;
let pillar2Height = 0;

// Pillar generation
const createPillars = () => {
    // Refresh pillars
    if (pillar1Mesh || pillar2Mesh || pillar1Body || pillar2Body) {
        // Cannon.js
        pillar1Body.shapes = [];
        pillar2Body.shapes = [];
        pillar1Body.updateMassProperties();
        pillar2Body.updateMassProperties();
        world.removeBody(pillar1Body);
        world.removeBody(pillar2Body);
        pillar1Body.removeEventListener('collide', stop);
        pillar2Body.removeEventListener('collide', stop);

        // Three.js
        pillar1Geometry?.dispose();
        pillar2Geometry?.dispose();
        scene.remove(pillar1Mesh, pillar2Mesh);
    }

    // Pillar Heights
    pillar1Height = 1 + Math.random() * parameters.pillarWindow;
    pillar2Height = parameters.pillarWindow - pillar1Height + 2;

    // Three.js
    pillar1Geometry = new THREE.CylinderBufferGeometry(1, 1, pillar1Height, 20);
    pillar2Geometry = new THREE.CylinderBufferGeometry(1, 1, pillar2Height, 20);
    pillar1Mesh = new THREE.Mesh(pillar1Geometry, pillarMaterial);
    pillar2Mesh = new THREE.Mesh(pillar2Geometry, pillarMaterial);
    pillar1Mesh.castShadow = true;
    pillar2Mesh.castShadow = true;
    pillar1Mesh.receiveShadow = true;
    pillar2Mesh.receiveShadow = true;
    // pillar1Mesh.scale.y = pillar1Height;
    // pillar2Mesh.scale.y = pillar2Height;
    pillar1Mesh.position.set(
        parameters.boundary,
        parameters.ceilHeight - pillar1Height / 2,
        0
    );
    pillar2Mesh.position.set(
        parameters.boundary,
        parameters.floorHeight + pillar2Height / 2,
        0
    );
    scene.add(pillar1Mesh, pillar2Mesh);

    // Cannon.js
    pillar1Shape = new CANNON.Cylinder(1, 1, pillar1Height, 20);
    pillar2Shape = new CANNON.Cylinder(1, 1, pillar2Height, 20);
    pillar1Body.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI);
    pillar2Body.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI);
    pillar1Body.addShape(pillar1Shape);
    pillar2Body.addShape(pillar2Shape);
    pillar1Body.position.copy(pillar1Mesh.position);
    pillar2Body.position.copy(pillar2Mesh.position);
    pillar1Body.addEventListener('collide', stop);
    pillar2Body.addEventListener('collide', stop);
    world.addBody(pillar1Body);
    world.addBody(pillar2Body);
};

// Initial pillar generation
createPillars();

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 400;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.bottom = -100;
directionalLight.position.set(50, 50, -200);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

// const directionalLightHelper = new THREE.DirectionalLightHelper(
//     directionalLight
// );
// scene.add(directionalLightHelper);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('dblclick', () => {
    const fullscreenElement =
        document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
    55,
    sizes.width / sizes.height
    // 0.1,
    // 500
);
camera.position.set(0, 0, 9);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// renderer.setClearColor('#0099cc');

const playHitSound = (collision) => {
    // const impactStrength = collision.contact.getImpactVelocityAlongNormal();
    hitSound.currentTime = 0;
    hitSound.play();
};

/**
 * Bird
 */

// Sphere
const sphereGeometry = new THREE.SphereBufferGeometry(1, 6, 6);
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.4,
    roughness: 0.7,
    transparent: true,
    color: '#ff0000',
    wireframe: true,
    // visible: false,
});

const radius = 0.5;

// Three.js birdBody
const birdMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
birdMesh.scale.set(radius, radius, radius);
// if (birdGltfMesh) {
//     birdGltfMesh.position.copy(birdMesh.position);
// }
birdMesh.position.set(0, 0, 0);
birdMesh.castShadow = true;
gui.add(birdMesh, 'visible');
scene.add(birdMesh);

// Cannon.js birdBody
const shape = new CANNON.Sphere(radius);
const birdBody = new CANNON.Body({
    mass: 2,
    position: new CANNON.Vec3(0, 3, 0),
    shape,
    material: defaultMaterial,
});
birdBody.position.copy(birdMesh.position);
birdBody.addEventListener('collide', playHitSound);
world.addBody(birdBody);

// Bird Controls
let bool = true;

parameters.jump = () => {
    birdBody.applyLocalImpulse(
        new CANNON.Vec3(0, parameters.impulseValue, 0),
        new CANNON.Vec3(0, 0, 0)
    );
};

parameters.restart = () => {
    bool = true;
    tick();
};

document.body.onkeyup = (e) => {
    if (e.keyCode == 32) {
        birdBody.applyImpulse(
            new CANNON.Vec3(0, parameters.impulseValue, 0),
            // new CANNON.Vec3(0, 0, 0)
            birdBody.position
        );
        birdGltfMesh.position.x = -0.5;
        birdGltfMesh.rotation.z = 0.1;
    }
    if (e.keyCode == 'R'.charCodeAt(0)) {
        bool = true;
        tick();
    }
};

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

gui.add(parameters, 'jump');
gui.add(parameters, 'restart');

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
    stats.begin();
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // Update physics world
    world.step(1 / 60, deltaTime, 3);

    // Moving Background
    // if (buildingMesh.position.x < -parameters.boundary * 3)
    //     buildingMesh.position.x = parameters.boundary * 3;
    // buildingMesh.position.x -= deltaTime * parameters.speed;
    // if (buildGltfMesh) {
    //     if (buildGltfMesh.position.x < -parameters.boundary * 30) {
    //         buildGltfMesh.position.x = 600;
    //     }
    //     buildGltfMesh.position.x -= deltaTime * parameters.speed;
    // }
    // if (cityMesh2) {
    //     if (cityMesh2.position.x < -parameters.boundary * 30) {
    //         cityMesh2.position.x = 600;
    //     }
    //     // cityMesh2.position.x -= deltaTime * parameters.speed;
    // }

    if (pillar1Body.position.x < -parameters.boundary) {
        createPillars();
    }
    pillar1Body.position.x -= deltaTime * parameters.speed;
    pillar2Body.position.x -= deltaTime * parameters.speed;

    // Update threejs world
    birdGltfMesh?.rotation.reorder('ZYX');
    birdBody.position.x = 0;
    birdBody.position.z = 0;
    birdBody.quaternion.x = 0;
    birdBody.quaternion.y = 0;
    birdBody.quaternion.z = 0;
    birdBody.position.z = -5;
    birdMesh.position.copy(birdBody.position);

    pillar1Body.position.z = 0;
    pillar2Body.position.z = 0;
    pillar1Mesh.position.copy(pillar1Body.position);
    pillar2Mesh.position.copy(pillar2Body.position);
    pillar2Mesh.quaternion.copy(pillar2Body.quaternion);
    if (birdGltfMesh) {
        birdGltfMesh.position.y = birdBody.position.y + 1.3;
        birdGltfMesh.position.z = birdBody.position.z;
        // // birdGltfMesh.quaternion.copy(birdMesh.quaternion);
        // birdGltfMesh.rotation.y = Math.PI * 0.5;
        // birdGltfMesh.rotation.x += deltaTime * 0.2;
        // birdGltfMesh.position.x += deltaTime * 0.01;
    }

    // Update controls
    // camera.position.y = birdBody.position.y / 1.5;
    controls.update();

    // directionalLightHelper.update();

    // Animation Controls
    mixer?.update(deltaTime);

    // Bird Rotation Animation
    // birdGltfMesh?.rotation.y = Math.PI * 0.5;
    // if (birdGltfMesh) {
    //     birdGltfMesh.rotation.y = Math.PI * 0.5;
    //     birdGltfMesh.rotation.z -= deltaTime * 0.2;
    //     // birdGltfMesh.position.y = -elapsedTime * 1.5;
    // }

    // Render
    renderer.render(scene, camera);

    if (helper) helper.update();

    // Call tick again on the next frame
    // window.requestAnimationFrame(tick);
    if (bool) window.requestAnimationFrame(tick);
    else {
        world.removeBody(birdBody);
        world.addBody(birdBody);
        buildingMesh.position.x = parameters.boundary * 3;
        birdMesh.position.set(0, 0, 0);
        birdBody.position.copy(birdMesh.position);
        pillar1Mesh.position.set(
            parameters.boundary,
            parameters.ceilHeight - pillar1Height / 2,
            0
        );
        pillar2Mesh.position.set(
            parameters.boundary,
            parameters.floorHeight + pillar2Height / 2,
            0
        );
        pillar1Body.position.copy(pillar1Mesh.position);
        pillar2Body.position.copy(pillar2Mesh.position);
    }
    stats.end();
};

tick();

// 700 lines!
