import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

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
    radius: 0.4,
    speed: 5,
    boundary: 15,
    floorHeight: -9,
    ceilHeight: 9,
    pillarWindow: 12,
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
const textureLoader = new THREE.TextureLoader();

/**
 * Models
 */
const gltfLoader = new GLTFLoader();
const objloader = new OBJLoader();
let birdGltfMesh = null;
let roadMesh = null;
let cityMesh = null;
// let treeMesh = null;
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

// gltfLoader.load('/models/tree/tree.glb', (glb) => {
//     treeMesh = glb.scene;
//     treeMesh.scale.set(2, 2, 2);
//     treeMesh.position.y = -10;
//     treeMesh.castShadow = true;
//     scene.add(treeMesh);
// });

// gltfLoader.load('/models/road/uploads_files_3624686_11.glb', (glb) => {
//     roadMesh = glb.scene;
//     roadMesh.scale.set(15, 15, 15);
//     let r = 60;
//     roadMesh.rotation.y = Math.PI + 0.003;
//     roadMesh.position.set(r * -50, r * -12.07, r * -33.6);
//     scene.add(roadMesh);
// });

const cityTexture1 = textureLoader.load('/textures/city/ang1.jpg');
const cityTexture2 = textureLoader.load('/textures/city/cty1.jpg');
const cityTexture3 = textureLoader.load('/textures/city/cty2x.jpg');

objloader.load('/models/road/city.obj', (obj) => {
    cityMesh = obj;
    console.log(cityMesh);
    cityMesh.children[0].material[0].map = cityTexture2;
    cityMesh.children[0].material[1].map = cityTexture1;
    cityMesh.children[1].material.map = cityTexture2;
    cityMesh.children[2].material.transparent = 1;
    cityMesh.position.y = -100;
    cityMesh.position.x = 100;
    cityMesh.scale.set(0.4, 0.4, 0.4);
    scene.add(cityMesh);
});

/**
 * Sounds
 */
// const hitSound = new Audio('/sounds/hit.mp3');

/**
 * Textures
 */

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
const skyboxTexture_ft = textureLoader.load(
    './textures/skybox3/bluecloud_ft.jpg'
);
const skyboxTexture_bk = textureLoader.load(
    './textures/skybox3/bluecloud_bk.jpg'
);
const skyboxTexture_up = textureLoader.load(
    './textures/skybox3/bluecloud_up.jpg'
);
const skyboxTexture_dn = textureLoader.load(
    './textures/skybox3/bluecloud_dn.jpg'
);
const skyboxTexture_rt = textureLoader.load(
    './textures/skybox3/bluecloud_rt.jpg'
);
const skyboxTexture_lt = textureLoader.load(
    './textures/skybox3/bluecloud_lf.jpg'
);
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_ft }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_bk }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_up }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_dn }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_rt }));
skyboxMaterial.push(new THREE.MeshBasicMaterial({ map: skyboxTexture_lt }));

for (let i = 0; i < skyboxMaterial.length; i++)
    skyboxMaterial[i].side = THREE.BackSide;

const skyboxGeometry = new THREE.BoxBufferGeometry(2000, 2000, 2000);
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
    new THREE.PlaneGeometry(50, 20, 20, 10),
    new THREE.MeshStandardMaterial({
        color: '#bb2236',
        metalness: 0.3,
        roughness: 0.4,
        // envMap: environmentMapTexture,
        envMapIntensity: 0.5,
        wireframe: true,
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

// const pillarObj = [
//     // material
//     new THREE.MeshStandardMaterial({
//         color: '#747474',
//         metalness: 0.7,
//         roughness: 0.3,
//         envMap: environmentMapTexture,
//         envMapIntensity: 0.6,
//     }),
//     // geometry
//     null,
//     // mesh
//     null,
// ];

// const pillars = [pillarObj, pillarObj, pillarObj];

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

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 400;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.bottom = -100;
directionalLight.position.set(10, 100, 50);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

const directionalLightHelper = new THREE.DirectionalLightHelper(
    directionalLight
);
scene.add(directionalLightHelper);

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
camera.position.set(0, 0, 20);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

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
    // hitSound.currentTime = 0;
    // hitSound.play();
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

const radius = parameters.radius;

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
        // birdGltfMesh.position.x = -0.5;
        // birdGltfMesh.rotation.z = 0.1;
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

    if (roadMesh) roadMesh.position.x -= deltaTime * parameters.speed;
    if (cityMesh) cityMesh.position.x -= deltaTime * parameters.speed;

    if (pillar1Body.position.x < -parameters.boundary) {
        createPillars();
    }
    pillar1Body.position.x -= deltaTime * parameters.speed;
    pillar2Body.position.x -= deltaTime * parameters.speed;

    // Update threejs world
    // birdGltfMesh?.rotation.reorder('ZYX');
    birdBody.position.x = 0;
    birdBody.position.z = 0;
    birdBody.quaternion.x = 0;
    birdBody.quaternion.y = 0;
    birdBody.quaternion.z = 0;
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

    directionalLightHelper.update();

    // Animation Controls
    mixer?.update(deltaTime);

    // Render
    renderer.render(scene, camera);

    if (helper) helper.update();

    // Call tick again on the next frame
    // window.requestAnimationFrame(tick);
    window.requestAnimationFrame(tick);
    stats.end();
};

tick();

// 700 lines!
