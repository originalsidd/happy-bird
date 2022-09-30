import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';

/**
 * Debug
 */
const gui = new dat.GUI();
const debugObject = {};

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Constants
 */
const boundary = 15;
const floorHeight = -5;
const ceilHeight = 5;
const impulseValue = 15;

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
    `/textures/environmentMaps/0/px.png`,
    `/textures/environmentMaps/0/nx.png`,
    `/textures/environmentMaps/0/py.png`,
    `/textures/environmentMaps/0/ny.png`,
    `/textures/environmentMaps/0/pz.png`,
    `/textures/environmentMaps/0/nz.png`,
]);

/**
 * Physics
 */
// World
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -9.82, 0);

const stop = () => {
    bool = false;
};

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

// Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
    position: new CANNON.Vec3(0, floorHeight, 0),
});
const ceilBody = new CANNON.Body({
    position: new CANNON.Vec3(0, floorHeight + 10, 0),
});
// floorBody.material = defaultMaterial;
floorBody.mass = 0;
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
ceilBody.mass = 0;
ceilBody.addShape(floorShape);
ceilBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);
world.addBody(ceilBody);

/**
 * Pillars
 */

const pillarMaterial = new THREE.MeshStandardMaterial({
    color: '#747474',
    metalness: 0.7,
    roughness: 0.3,
    envMap: environmentMapTexture,
    envMapIntensity: 0.6,
});
let pillar1 = null;
let pillar2 = null;

const body1 = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, 0),
    material: defaultMaterial,
});
const body2 = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, 0),
    material: defaultMaterial,
});

let pillar1Geometry = null;
let pillar2Geometry = null;

let shape1 = null;
let shape2 = null;

const createPillars = () => {
    if (pillar1 || pillar2 || body1 || body2) {
        body1.shapes = [];
        body2.shapes = [];
        body1.updateMassProperties();
        body2.updateMassProperties();
        world.removeBody(body1);
        world.removeBody(body2);
        pillar1Geometry?.dispose();
        pillar2Geometry?.dispose();
        scene.remove(pillar1, pillar2);
    }

    let pillar1Height = 1 + Math.random() * 4;
    let pillar2Height = 6 - pillar1Height;
    body1.removeEventListener('collide', stop);
    body2.removeEventListener('collide', stop);

    // Three.js
    pillar1Geometry = new THREE.CylinderBufferGeometry(1, 1, pillar1Height, 20);
    pillar2Geometry = new THREE.CylinderBufferGeometry(1, 1, pillar2Height, 20);
    pillar1 = new THREE.Mesh(pillar1Geometry, pillarMaterial);
    pillar2 = new THREE.Mesh(pillar2Geometry, pillarMaterial);
    pillar1.receiveShadow = true;
    pillar2.receiveShadow = true;
    // pillar1.scale.y = pillar1Height;
    // pillar2.scale.y = pillar2Height;
    pillar1.position.set(boundary, ceilHeight - pillar1Height / 2, 0);
    pillar2.position.set(boundary, floorHeight + pillar2Height / 2, 0);
    scene.add(pillar1, pillar2);

    // Cannon.js body
    shape1 = new CANNON.Cylinder(1, 1, pillar1Height, 20);
    shape2 = new CANNON.Cylinder(1, 1, pillar2Height, 20);
    body1.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI);
    body2.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI);
    body1.addShape(shape1);
    body2.addShape(shape2);
    body1.position.copy(pillar1.position);
    body2.position.copy(pillar2.position);
    world.addBody(body1);
    world.addBody(body2);
    body1.addEventListener('collide', stop);
    body2.addEventListener('collide', stop);
};

// pillar

createPillars();

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.BoxBufferGeometry(10, 20, 5),
    new THREE.MeshStandardMaterial({
        color: '#997777',
        metalness: 0.7,
        roughness: 0.3,
        envMap: environmentMapTexture,
        envMapIntensity: 0.6,
    })
);
floor.receiveShadow = true;
// floor.rotation.x = -Math.PI * 0.5;
floor.position.set(boundary, 0, -20);
scene.add(floor);

const floor2 = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 10),
    new THREE.MeshStandardMaterial({
        color: '#229922',
        metalness: 0.3,
        roughness: 0.4,
        // envMap: environmentMapTexture,
        envMapIntensity: 0.5,
    })
);
floor2.receiveShadow = true;
floor2.rotation.x = -Math.PI * 0.5;
floor2.position.set(0, floorHeight, 0);
scene.add(floor2);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 25;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

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
    sizes.width / sizes.height,
    0.1,
    100
);
camera.position.set(0, 0, 11);
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
renderer.setClearColor('#0099cc');

const playHitSound = (collision) => {
    // const impactStrength = collision.contact.getImpactVelocityAlongNormal();
    hitSound.currentTime = 0;
    hitSound.play();
    console.log(
        body1.position.y,
        body2.position.y,
        collision.contact.bi.position.y,
        collision.contact.bj.position.y
    );
};

/**
 * Utils
 */
// const objectsToUpdate = [];

// Sphere
const sphereGeometry = new THREE.SphereBufferGeometry(1, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.4,
    roughness: 0.7,
    // envMap: environmentMapTexture,
});

const radius = 0.5;

// Three.js body
const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
mesh.scale.set(radius, radius, radius);
mesh.castShadow = true;
mesh.position.set(0, 0, 0);
scene.add(mesh);

// Cannon.js body
const shape = new CANNON.Sphere(radius);
const body = new CANNON.Body({
    mass: 2,
    position: new CANNON.Vec3(0, 3, 0),
    shape,
    material: defaultMaterial,
});
body.position.copy(mesh.position);
body.addEventListener('collide', playHitSound);
world.addBody(body);

let bool = true;

debugObject.jump = () => {
    body.applyLocalImpulse(
        new CANNON.Vec3(0, impulseValue, 0),
        new CANNON.Vec3(0, 0, 0)
    );
};

debugObject.restart = () => {
    bool = true;
    tick();
};

document.body.onkeyup = (e) => {
    if (e.keyCode == 32) {
        body.applyLocalImpulse(
            new CANNON.Vec3(0, impulseValue, 0),
            new CANNON.Vec3(0, 0, 0)
        );
    }
    if (e.keyCode == 'R'.charCodeAt(0)) {
        bool = true;
        tick();
    }
};

gui.add(debugObject, 'jump');
gui.add(debugObject, 'restart');

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // Update physics world
    if (bool) {
        world.step(1 / 60, deltaTime, 3);

        if (floor.position.x < -boundary) floor.position.x = boundary;
        floor.position.x -= deltaTime * 5;

        if (body1.position.x < -boundary) {
            createPillars();
        }
        body1.position.x -= deltaTime * 5;
        body2.position.x -= deltaTime * 5;

        // Update threejs world

        body.position.x = 0;
        body.position.z = 0;
        body.quaternion.x = 0;
        body.quaternion.y = 0;
        body.quaternion.z = 0;
        mesh.position.copy(body.position);
        body1.position.z = 0;
        body2.position.z = 0;
        pillar1.position.copy(body1.position);
        pillar2.position.copy(body2.position);
        pillar2.quaternion.copy(body2.quaternion);
    }

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
