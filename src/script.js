import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

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
    radius: 0.2,
    // speed: 0,
    speed: 8,
    boundary: 20,
    floorHeight: -9,
    ceilHeight: 16,
    pillarWindow: 18,
    impulseValue: 25,
    roadRepeat: 85.5,
    jumpVelocity: 15,
};

/**
 * Debug
 */
const gui = new dat.GUI();
gui.add(parameters, 'speed').min(0).max(100).step(1);
gui.add(parameters, 'boundary').min(10).max(30).step(1);
gui.add(parameters, 'floorHeight').min(-10).max(-5).step(1);
gui.add(parameters, 'ceilHeight').min(5).max(20).step(1);
gui.add(parameters, 'pillarWindow').min(0).max(25).step(1);
gui.add(parameters, 'impulseValue').min(10).max(50).step(1);
gui.add(parameters, 'jumpVelocity').min(10).max(20).step(1);

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
const mtlLoader = new MTLLoader();
let birdGltfMesh = null;
let car_sedan = null;
let car_wagon = null;
let roadMesh = null;
let cityMesh = null;
// let lightMesh = null;
let bgcityMesh = null;
let terraceMesh = [null, null, null];
let buildMesh = [null, null];
// let treeMesh = null;
let mixer = null;
let helper = null;

// gltfLoader.load('/models/crow/scene.gltf', (gltf) => {
//     birdGltfMesh = gltf.scene;
//     mixer = new THREE.AnimationMixer(birdGltfMesh);
//     const action = mixer.clipAction(gltf.animations[0]);
//     // action.setDuration(1);
//     action.play();
//     // action.startAt(-7);
//     birdGltfMesh.scale.set(0.025, 0.025, 0.025);
//     birdGltfMesh.rotation.y = Math.PI * 0.5;
//     // console.log(birdMesh.position, birdGltfMesh.position);
//     birdGltfMesh.castShadow = true;
//     scene.add(birdGltfMesh);
// });
let action = null;
gltfLoader.load('/models/crow/bird.glb', (glb) => {
    birdGltfMesh = glb.scene;
    mixer = new THREE.AnimationMixer(birdGltfMesh);
    action = mixer.clipAction(glb.animations[0]);
    action.timeScale = 1.5;
    action.play();
    birdGltfMesh.scale.set(0.025, 0.025, 0.025);
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
const windowTexture = textureLoader.load('/textures/window/window.png');

// const pipeTexture1 = textureLoader.load(
//     '/textures/pipe/RustPlain007_COL_VAR1_1K.jpg'
// );
// const pipeTexture2 = textureLoader.load(
//     '/textures/pipe/RustPlain007_NRM_1K.jpg'
// );
// const pipeTexture3 = textureLoader.load(
//     '/textures/pipe/RustPlain007_GLOSS_1K.jpg'
// );
const pipeTexture1 = textureLoader.load(
    '/textures/pipe2/MetalCorrodedHeavy001_COL_1K_METALNESS.jpg'
);
const pipeTexture2 = textureLoader.load(
    '/textures/pipe2/MetalCorrodedHeavy001_NRM_1K_METALNESS.jpg'
);
const pipeTexture3 = textureLoader.load(
    '/textures/pipe2/MetalCorrodedHeavy001_ROUGHNESS_1K_METALNESS.jpg'
);
const pipeTexture4 = textureLoader.load(
    '/textures/pipe2/MetalCorrodedHeavy001_METALNESS_1K_METALNESS.jpg'
);

// objloader.load('/models/road/city.obj', (obj) => {
//     cityMesh = obj;
//     console.log(cityMesh);
//     cityMesh.children[0].material[0].map = cityTexture2;
//     cityMesh.children[0].material[1].map = cityTexture1;
//     cityMesh.children[1].material.map = cityTexture2;
//     cityMesh.children[2].material.transparent = 1;
//     cityMesh.position.y = -50;
//     cityMesh.position.x = 100;
//     // cityMesh.rotation.y = Math.PI;
//     cityMesh.scale.set(0.4, 0.4, 0.4);
//     scene.add(cityMesh);
// });

mtlLoader.load('/models/city2/City block.mtl', (materials) => {
    const objloader = new OBJLoader();
    materials.preload();
    objloader.setMaterials(materials);
    objloader.load('/models/city2/City block.obj', (obj) => {
        buildMesh[0] = obj;
        buildMesh[0].scale.set(4, 4, 4);
        buildMesh[0].position.z = -1300;
        buildMesh[0].position.y = -220;
        buildMesh[0].position.x = -200;
        buildMesh[0].children.forEach((child) => {
            child.material.color.set(new THREE.Color(0.7, 0.7, 0.7));
            child.material.shininess = 1;
            child.material.envMap = environmentMapTexture;
        });
        scene.add(buildMesh[0]);
    });
    objloader.load('/models/city2/City block.obj', (obj) => {
        buildMesh[1] = obj;
        buildMesh[1].scale.set(4, 4, 4);
        buildMesh[1].position.z = -1200;
        buildMesh[1].position.y = -220;
        buildMesh[1].position.x = 2100 - 200;
        buildMesh[1].children.forEach((child) => {
            child.material.color.set(new THREE.Color(0.7, 0.7, 0.7));
            child.material.shininess = 1;
            child.material.envMap = environmentMapTexture;
        });
        scene.add(buildMesh[1]);
    });
});

const car_color = textureLoader.load(
    '/textures/cars/VehiclePack_BaseColor.png'
);
const car_metal = textureLoader.load('/textures/cars/VehiclePack_Metalnes.png');
const car_rough = textureLoader.load('/textures/cars/VehiclePack_Roughnes.png');

mtlLoader.load('/models/cars/Sedan_A_beige.mtl', (materials) => {
    const objloader = new OBJLoader();
    materials.preload();
    objloader.setMaterials(materials);
    objloader.load('/models/cars/Sedan_A_beige.obj', (obj) => {
        car_sedan = obj;
        car_sedan.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.map = car_color;
                child.material.metalnessMap = car_metal;
                child.material.roughnessMap = car_rough;
            }
        });
        car_sedan.scale.set(3, 3, 3);
        car_sedan.rotation.y = -Math.PI / 2;
        car_sedan.position.y = -8.5;
        car_sedan.position.z = -17;
        car_sedan.position.x = 200;
        scene.add(car_sedan);
    });
});

mtlLoader.load('/models/cars/Hatch_C_beige.mtl', (materials) => {
    const objloader = new OBJLoader();
    materials.preload();
    objloader.setMaterials(materials);
    objloader.load('/models/cars/Hatch_C_beige.obj', (obj) => {
        car_wagon = obj;
        car_wagon.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.map = car_color;
                child.material.metalnessMap = car_metal;
                child.material.roughnessMap = car_rough;
            }
        });
        car_wagon.scale.set(3, 3, 3);
        car_wagon.rotation.y = -Math.PI / 2;
        car_wagon.position.y = -8.5;
        car_wagon.position.z = -9;
        car_wagon.position.x = 300;
        scene.add(car_wagon);
    });
});

const c = 3;

gltfLoader.load('/models/road/road1.glb', (glb) => {
    terraceMesh[0] = glb.scene;
    terraceMesh[0].scale.set(c, c, c);
    terraceMesh[0].position.y = -9;
    terraceMesh[0].rotation.y = Math.PI / 2;
    terraceMesh[0].position.z = 9.5;
    terraceMesh[0].receiveShadow = true;
    terraceMesh[0].position.x = 20;
    scene.add(terraceMesh[0]);
});
gltfLoader.load('/models/road/road1.glb', (glb) => {
    terraceMesh[1] = glb.scene;
    terraceMesh[1].scale.set(c, c, c);
    terraceMesh[1].position.y = -9;
    terraceMesh[1].rotation.y = Math.PI / 2;
    terraceMesh[1].position.z = 9.5;
    terraceMesh[1].position.x = parameters.roadRepeat + 20;
    terraceMesh[1].receiveShadow = true;
    scene.add(terraceMesh[1]);
});
gltfLoader.load('/models/road/road1.glb', (glb) => {
    terraceMesh[2] = glb.scene;
    terraceMesh[2].scale.set(c, c, c);
    terraceMesh[2].position.y = -9;
    terraceMesh[2].rotation.y = Math.PI / 2;
    terraceMesh[2].position.z = 9.5;
    terraceMesh[2].position.x = 2 * parameters.roadRepeat + 20;
    terraceMesh[2].receiveShadow = true;
    scene.add(terraceMesh[2]);
});

// mtlLoader.load('/models/floor/floor.mtl', (materials) => {
//     const objloader = new OBJLoader();
//     materials.preload();
//     objloader.setMaterials(materials);
//     objloader.load('/models/floor/floor.obj', (obj) => {
//         terraceMesh[0] = obj;
//         terraceMesh[0].children.forEach((child) => {
//             child.material.map = cityTexture1;
//             child.receiveShadow = true;
//         });
//         terraceMesh[0].scale.set(0.05, 0.05, 0.05);
//         terraceMesh[0].position.z = -45;
//         terraceMesh[0].position.x = -30;
//         terraceMesh[0].position.y = -29.5;
//         terraceMesh[0].receiveShadow = true;
//         scene.add(terraceMesh[0]);
//     });
//     objloader.load('/models/floor/floor.obj', (obj) => {
//         terraceMesh[1] = obj;
//         terraceMesh[1].children.forEach((child) => {
//             child.material.map = cityTexture1;
//             child.receiveShadow = true;
//         });
//         terraceMesh[1].scale.set(0.05, 0.05, 0.05);
//         terraceMesh[1].position.z = -45;
//         terraceMesh[1].position.x = -30 + 95;
//         terraceMesh[1].position.y = -29.5;
//         terraceMesh[1].receiveShadow = true;
//         scene.add(terraceMesh[1]);
//     });
//     objloader.load('/models/floor/floor.obj', (obj) => {
//         terraceMesh[2] = obj;
//         terraceMesh[2].children.forEach((child) => {
//             child.material.map = cityTexture1;
//             child.receiveShadow = true;
//         });
//         terraceMesh[2].scale.set(0.05, 0.05, 0.05);
//         terraceMesh[2].position.z = -45;
//         terraceMesh[2].position.x = -30 + 190;
//         terraceMesh[2].position.y = -29.5;
//         terraceMesh[2].receiveShadow = true;
//         scene.add(terraceMesh[2]);
//     });
// });

/**
 * Sounds
 */
// const hitSound = new Audio('/sounds/hit.mp3');

/**
 * Textures
 */

const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
    './textures/skybox3/bluecloud_ft.jpg',
    './textures/skybox3/bluecloud_bk.jpg',
    './textures/skybox3/bluecloud_up.jpg',
    './textures/skybox3/bluecloud_dn.jpg',
    './textures/skybox3/bluecloud_rt.jpg',
    './textures/skybox3/bluecloud_lf.jpg',
]);

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

// window.addEventListener('', () => {
//     const fullscreenElement =
//         document.fullscreenElement || document.webkitFullscreenElement;

//     if (!fullscreenElement) {
//         if (canvas.requestFullscreen) {
//             canvas.requestFullscreen();
//         } else if (canvas.webkitRequestFullscreen) {
//             canvas.webkitRequestFullscreen();
//         }
//     } else {
//         if (document.exitFullscreen) {
//             document.exitFullscreen();
//         } else if (document.webkitExitFullscreen) {
//             document.webkitExitFullscreen();
//         }
//     }
// });

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
    55,
    sizes.width / sizes.height,
    0.1,
    5000
);
const camDist = window.innerWidth < 800 ? 30 : 15;
camera.position.set(0, 0, camDist);
scene.add(camera);

// Controls
let controls;
// controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

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

const skyboxGeometry = new THREE.BoxBufferGeometry(5000, 5000, 5000);
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);
skybox.position.y = -200;

/**
 * Physics
 */

// World
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
// world.gravity.set(0, -25, 0);
world.gravity.set(0, 0, 0);

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

floorBody.addEventListener('collide', stop);

/**
 * Meshes
 */

// const floorMesh = new THREE.Mesh(
//     new THREE.PlaneGeometry(50, 20, 20, 10),
//     new THREE.MeshStandardMaterial({
//         color: '#bb2236',
//         metalness: 0.3,
//         roughness: 0.4,
//         // envMap: environmentMapTexture,
//         envMapIntensity: 0.5,
//         wireframe: true,
//     })
// );
// floorMesh.receiveShadow = true;
// floorMesh.rotation.x = -Math.PI * 0.5;
// floorMesh.position.set(0, parameters.floorHeight, 0);
// scene.add(floorMesh);

const seaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000, 1, 1),
    new THREE.MeshStandardMaterial({
        color: '#eee',
        metalness: 0.6,
        roughness: 0.9,
    })
);
seaMesh.rotation.x = -Math.PI * 0.5;
seaMesh.position.set(0, -200, -700);
scene.add(seaMesh);

// const ceilMesh = new THREE.Mesh(
//     new THREE.PlaneGeometry(50, 20, 20, 10),
//     new THREE.MeshStandardMaterial({
//         color: '#999922',
//         metalness: 0.2,
//         roughness: 0.8,
//         wireframe: true,
//     })
// );
// ceilMesh.rotation.x = Math.PI * 0.5;
// ceilMesh.position.set(0, parameters.ceilHeight, 0);
// scene.add(ceilMesh);

const ceilPole = new THREE.Mesh(
    new THREE.BoxGeometry(50, 2.5, 0.1, 1, 1, 1),
    new THREE.MeshStandardMaterial({
        color: '#222',
        metalness: 0.2,
        roughness: 0.8,
    })
);
ceilPole.rotation.x = Math.PI * 0.5;
ceilPole.position.set(0, parameters.ceilHeight, 0);
scene.add(ceilPole);

/**
 * Pillars
 */

// Three.js mesh

// Material
const pillarMaterial = new THREE.MeshStandardMaterial({
    color: '#747474',
    metalness: 0.7,
    roughness: 0.3,
    // envMap: environmentMapTexture,
    envMapIntensity: 0.6,
});

// Geometry
let pillar1Geometry = null;
let pillar2Geometry = null;
let pillar3Geometry = null;
let pillar4Geometry = null;

// Mesh
let pillar1Mesh = null;
let pillar2Mesh = null;
let pillar3Mesh = null;
let pillar4Mesh = null;

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

const pillar3Body = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, 0),
    material: defaultMaterial,
});

const pillar4Body = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, 0),
    material: defaultMaterial,
});

// Shape
let pillar1Shape = null;
let pillar2Shape = null;
let pillar3Shape = null;
let pillar4Shape = null;

// Height
let pillar1Height = 0;
let pillar2Height = 0;
let pillar3Height = 0;
let pillar4Height = 0;

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
    pillar1Mesh.material.map = pipeTexture1;
    pillar1Mesh.material.normalMap = pipeTexture2;
    pillar1Mesh.material.roughnessMap = pipeTexture3;
    pillar1Mesh.material.metalnessMap = pipeTexture4;
    pillar2Mesh.material.map = pipeTexture1;
    pillar2Mesh.material.normalMap = pipeTexture2;
    pillar2Mesh.material.roughnessMap = pipeTexture3;
    pillar2Mesh.material.metalnessMap = pipeTexture4;
    // pillar1Mesh.scale.y = pillar1Height;
    // pillar2Mesh.scale.y = pillar2Height;
    pillar1Mesh.position.set(
        camera.position.x + parameters.boundary + bufferx,
        parameters.ceilHeight - pillar1Height / 2,
        0
    );
    pillar2Mesh.position.set(
        camera.position.x + parameters.boundary + bufferx,
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

const createPillars2 = () => {
    // Refresh pillars
    if (pillar3Mesh || pillar4Mesh || pillar3Body || pillar4Body) {
        // Cannon.js
        pillar3Body.shapes = [];
        pillar4Body.shapes = [];
        pillar3Body.updateMassProperties();
        pillar4Body.updateMassProperties();
        world.removeBody(pillar3Body);
        world.removeBody(pillar4Body);
        pillar3Body.removeEventListener('collide', stop);
        pillar4Body.removeEventListener('collide', stop);

        // Three.js
        pillar3Geometry?.dispose();
        pillar4Geometry?.dispose();
        scene.remove(pillar3Mesh, pillar4Mesh);
    }

    // Pillar Heights
    pillar3Height = 1 + Math.random() * parameters.pillarWindow;
    pillar4Height = parameters.pillarWindow - pillar3Height + 2;

    // Three.js
    pillar3Geometry = new THREE.CylinderBufferGeometry(1, 1, pillar3Height, 20);
    pillar4Geometry = new THREE.CylinderBufferGeometry(1, 1, pillar4Height, 20);
    pillar3Mesh = new THREE.Mesh(pillar3Geometry, pillarMaterial);
    pillar4Mesh = new THREE.Mesh(pillar4Geometry, pillarMaterial);
    pillar3Mesh.castShadow = true;
    pillar4Mesh.castShadow = true;
    pillar3Mesh.receiveShadow = true;
    pillar4Mesh.receiveShadow = true;
    pillar3Mesh.material.map = pipeTexture1;
    pillar3Mesh.material.normalMap = pipeTexture2;
    pillar3Mesh.material.roughnessMap = pipeTexture3;
    pillar3Mesh.material.metalnessMap = pipeTexture4;
    pillar4Mesh.material.map = pipeTexture1;
    pillar4Mesh.material.normalMap = pipeTexture2;
    pillar4Mesh.material.roughnessMap = pipeTexture3;
    pillar4Mesh.material.metalnessMap = pipeTexture4;
    pillar3Mesh.position.set(
        camera.position.x + parameters.boundary + bufferx,
        parameters.ceilHeight - pillar3Height / 2,
        0
    );
    pillar4Mesh.position.set(
        camera.position.x + parameters.boundary + bufferx,
        parameters.floorHeight + pillar4Height / 2,
        0
    );
    scene.add(pillar3Mesh, pillar4Mesh);

    // Cannon.js
    pillar3Shape = new CANNON.Cylinder(1, 1, pillar3Height, 20);
    pillar4Shape = new CANNON.Cylinder(1, 1, pillar4Height, 20);
    pillar3Body.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI);
    pillar4Body.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI);
    pillar3Body.addShape(pillar3Shape);
    pillar4Body.addShape(pillar4Shape);
    pillar3Body.position.copy(pillar3Mesh.position);
    pillar4Body.position.copy(pillar4Mesh.position);
    pillar3Body.addEventListener('collide', stop);
    pillar4Body.addEventListener('collide', stop);
    world.addBody(pillar3Body);
    world.addBody(pillar4Body);
};

// Initial pillar generation
// setTimeout(() => {
//     createPillars();
// }, 5000);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// const light = new THREE.PointLight(0xffff88, 4, 100);
// light.position.set(0, 45, -20);
// scene.add(light);

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

// const directionalLightHelper = new THREE.DirectionalLightHelper(
//     directionalLight
// );
// scene.add(directionalLightHelper);

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

// const playHitSound = (collision) => {
// hitSound.currentTime = 0;
// hitSound.play();
// };

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
    visible: false,
});

const radius = parameters.radius;

// Three.js birdBody
const birdMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
birdMesh.scale.set(radius, radius, radius);
// if (birdGltfMesh) {
//     birdGltfMesh.position.copy(birdMesh.position);
// }
birdMesh.position.set(0, 3, 0);
birdMesh.castShadow = true;
gui.add(birdMesh, 'visible');
scene.add(birdMesh);

// Cannon.js birdBody
const shape = new CANNON.Sphere(radius);
const birdBody = new CANNON.Body({
    mass: 2,
    position: new CANNON.Vec3(0, 5, 0),
    shape,
    material: defaultMaterial,
});
birdBody.position.copy(birdMesh.position);
// birdBody.addEventListener('collide', playHitSound);
world.addBody(birdBody);
//
// Bird Controls
let bool = true;

let gravityFlag = false;

const jumpButton = () => {
    if (bool) {
        if (!gravityFlag) {
            // fun = setTimeout(() => {
            //     createPillars();
            // }, 2000);
            bufferx = 30;
            createPillars();
            bufferx = 0;
        }
        birdGltfMesh.rotation.z = 0.6;
        birdBody.velocity.y = parameters.jumpVelocity;
        gravityFlag = true;
    }
};

const restartButton = () => {
    if (!bool) {
        bool = true;
        camera.position.y = 0;
        birdBody.velocity.y = 0;
        birdBody.position.x = camera.position.x;
        birdGltfMesh.position.x = camera.position.x;
        // clearTimeout(fun);
        bufferx = 50;
        tick();
        bufferx = 0;
    }
};

document.body.onkeyup = (e) => {
    if (e.keyCode == 32) {
        jumpButton();
    }
    if (e.keyCode == 'R'.charCodeAt(0)) {
        restartButton();
    }
};

window.addEventListener('click', () => {
    jumpButton();
});

parameters.jump = () => {
    jumpButton();
};

parameters.restart = () => {
    restartButton();
};

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

gui.add(parameters, 'jump');
gui.add(parameters, 'restart');

// scene.fog = new THREE.Fog(0x777777f0, 1000, 1200);
renderer.setClearColor(0x202130, 1);

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;
let car1 = 5;
let car2 = 2;
let timeStop = 0;
let bufferx = 0;

const tick = () => {
    stats.begin();
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;
    if (gravityFlag) {
        // Update physics world

        if (pillar1Mesh) {
            if (
                pillar1Body.position.x <
                camera.position.x - parameters.boundary
            ) {
                createPillars();
            }
            if (parseInt(pillar1Body.position.x - camera.position.x) == 0) {
                createPillars2();
            }
        }
        world.step(1 / 60, deltaTime, 3);
        birdBody.velocity.y -= 30 * deltaTime;
        // console.log(gravityFlag);

        // car
        if (car_sedan) {
            car_sedan.position.x -= deltaTime * car1;
            if (car_sedan.position.x + 100 < camera.position.x) {
                car_sedan.position.x += 200;
                car1 = 10 * Math.random() + 5;
            }
        }
        if (car_wagon) {
            car_wagon.position.x -= deltaTime * car2;
            if (car_wagon.position.x + 200 < camera.position.x) {
                car_wagon.position.x += 300;
                car2 = 10 * Math.random() + 5;
            }
        }
        // Update controls
        camera.position.y = birdBody.position.y / 1.5 + 0.8;
        camera.position.x += deltaTime * parameters.speed;
        if (controls) controls.update();

        // Update threejs world
        // birdGltfMesh?.rotation.reorder('ZYX');
        birdBody.position.x = camera.position.x;
        birdBody.position.z = 0;
        birdBody.quaternion.x = 0;
        birdBody.quaternion.y = 0;
        birdBody.quaternion.z = 0;
        birdMesh.position.copy(birdBody.position);
        if (pillar1Mesh) {
            pillar1Body.position.z = 0;
            pillar2Body.position.z = 0;
            pillar1Mesh.position.copy(pillar1Body.position);
            pillar2Mesh.position.copy(pillar2Body.position);
        }
        if (birdGltfMesh) {
            birdGltfMesh.position.copy(birdBody.position);
            birdGltfMesh.rotation.z -= deltaTime * 0.7;
        }

        // directionalLightHelper.update();

        // Animation Controls
        mixer?.update(deltaTime);

        // Update floor
        if (terraceMesh[0]) {
            if (terraceMesh[0].position.x < camera.position.x - 150) {
                terraceMesh[0].position.x += parameters.roadRepeat * 3;
                let temp = terraceMesh[0];
                terraceMesh[0] = terraceMesh[1];
                terraceMesh[1] = terraceMesh[2];
                terraceMesh[2] = temp;
            }
        }

        // Update Building
        if (buildMesh[0]) {
            if (buildMesh[0].position.x < camera.position.x - 3000) {
                buildMesh[0].position.x += 4200;
                [buildMesh[0], buildMesh[1]] = [buildMesh[1], buildMesh[0]];
            }
        }

        // Update Skybox
        skybox.position.x = camera.position.x;

        ceilPole.position.x = camera.position.x;

        seaMesh.position.x = camera.position.x;

        // Update light
        // directionalLight.position.x += deltaTime * parameters.speed;
        // directionalLight.target.position.x += deltaTime * parameters.speed;

        // Render
        // if (birdBody.position.y < parameters.floorHeight + 0.1) {
        //     bool = false;
        // }
    }
    renderer.render(scene, camera);

    if (helper) helper.update();

    // Call tick again on the next frame
    // window.requestAnimationFrame(tick);
    if (bool) window.requestAnimationFrame(tick);
    else {
        timeStop = clock.getElapsedTime();
        world.removeBody(birdBody);
        world.addBody(birdBody);
        birdBody.velocity.y = 0;
        birdMesh.position.set(timeStop * parameters.speed, 0, 0);
        birdBody.position.copy(birdMesh.position);
        birdGltfMesh.position.copy(birdMesh.position);
        if (pillar1Mesh || pillar2Mesh || pillar1Body || pillar2Body) {
            // Cannon.js
            pillar1Body.shapes = [];
            pillar2Body.shapes = [];
            pillar1Body.updateMassProperties();
            pillar2Body.updateMassProperties();
            pillar1Body.removeEventListener('collide', stop);
            pillar2Body.removeEventListener('collide', stop);
            world.removeBody(pillar1Body);
            world.removeBody(pillar2Body);

            // Three.js
            pillar1Geometry?.dispose();
            pillar2Geometry?.dispose();
            scene.remove(pillar1Mesh, pillar2Mesh);
        }
        if (pillar3Mesh || pillar4Mesh || pillar3Body || pillar4Body) {
            // Cannon.js
            pillar3Body.shapes = [];
            pillar4Body.shapes = [];
            pillar3Body.updateMassProperties();
            pillar4Body.updateMassProperties();
            pillar3Body.removeEventListener('collide', stop);
            pillar4Body.removeEventListener('collide', stop);
            world.removeBody(pillar3Body);
            world.removeBody(pillar4Body);

            // Three.js
            pillar3Geometry?.dispose();
            pillar4Geometry?.dispose();
            scene.remove(pillar3Mesh, pillar4Mesh);
        }
        gravityFlag = false;
    }
    stats.end();
};
let flag = 0;

tick();

// 900 lines!
