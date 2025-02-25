import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

// Configuração do renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Criação da cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);

// Configuração da câmera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 15, 13);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

// Iluminação
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
directionalLight.castShadow = true;
directionalLight.position.set(0, 50, 0);
scene.add(directionalLight);

// Mundo físico
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

// Cesta
const basketGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 22);
const basketMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const basketMesh = new THREE.Mesh(basketGeometry, basketMaterial);
basketMesh.castShadow = true;
basketMesh.receiveShadow = true;
scene.add(basketMesh);

// Arrays para armazenar bolinhas
const meshes = [];
const bodies = [];

// Função para criar uma bola
function createBall() {
    const randomX = (Math.random() - 0.5) * 10;
    const randomZ = (Math.random() - 0.5) * 10;
    const randomY = 10;

    const sphereGeo = new THREE.SphereGeometry(0.125, 30, 30);
    const sphereMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xFFFFFF });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true;
    scene.add(sphereMesh);
    sphereMesh.position.set(randomX, randomY, randomZ);

    const spherePhysMat = new CANNON.Material();
    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.125),
        position: new CANNON.Vec3(randomX, randomY, randomZ),
        material: spherePhysMat
    });
    world.addBody(sphereBody);

    meshes.push(sphereMesh);
    bodies.push(sphereBody);
}

// Controle de geração de bolinhas
let intervalId = null;

function startBallGeneration() {
    if (intervalId) return;
    intervalId = setInterval(createBall, 500);
}

function stopBallGeneration() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

document.getElementById('startButton').addEventListener('click', startBallGeneration);
document.getElementById('stopButton').addEventListener('click', stopBallGeneration);

// Animação
const timestep = 1 / 60;

function animate() {
    world.step(timestep);

    for (let i = 0; i < meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);

        const distance = meshes[i].position.distanceTo(basketMesh.position);
        if (distance < 1) {
            scene.remove(meshes[i]);
            world.removeBody(bodies[i]);
            meshes.splice(i, 1);
            bodies.splice(i, 1);
            i--;
        }
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Redimensionamento da janela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});