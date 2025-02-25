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
camera.position.set(10, 20, 10);
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

// Anel (torus)
const ringRadius = 1;
const ringThickness = 0.1;
const ringGeometry = new THREE.TorusGeometry(ringRadius, ringThickness, 16, 100);
const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
ringMesh.castShadow = true;
ringMesh.receiveShadow = true;
ringMesh.position.set(0, 5, 0);
ringMesh.rotation.x = Math.PI / 2;
scene.add(ringMesh);

const ringPhysMat = new CANNON.Material();
const ringBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Cylinder(ringRadius, ringRadius, ringThickness, 32),
    material: ringPhysMat
});
ringBody.position.set(0, 5, 0);
ringBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(ringBody);

// Chão
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.receiveShadow = true;
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

const groundPhysMat = new CANNON.Material();
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    material: groundPhysMat
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Arrays para armazenar bolinhas
const meshes = [];
const bodies = [];

// Sistema de pontuação
let score = 0;
const scoreElement = document.getElementById('score');

// Sistema de cronômetro
let startTime = null;
let elapsedTime = 0;
let timerInterval = null;
const timerElement = document.getElementById('timer');

function updateTimer() {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    const seconds = Math.floor(elapsedTime / 1000);
    const milliseconds = Math.floor((elapsedTime % 1000) / 10);
    timerElement.textContent = `Tempo: ${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timerInterval) return; // Evita múltiplos intervalos
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateTimer, 10);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    timerElement.textContent = 'Tempo: 00:00';
}

// Função para criar uma bola
function createBall() {
    const randomX = (Math.random() - 0.5) * 10;
    const randomZ = (Math.random() - 0.5) * 10;
    const randomY = 10;

    const sphereGeo = new THREE.SphereGeometry(0.2, 30, 30);
    const sphereMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xFFFFFF });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true;
    scene.add(sphereMesh);
    sphereMesh.position.set(randomX, randomY, randomZ);

    const spherePhysMat = new CANNON.Material();
    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.2),
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
    startTimer(); // Inicia o cronômetro
}

function stopBallGeneration() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    stopTimer(); // Para o cronômetro
}

// Função para resetar (remover bolinhas, zerar pontuação e cronômetro)
function resetGame() {
    meshes.forEach(mesh => scene.remove(mesh));
    bodies.forEach(body => world.removeBody(body));
    meshes.length = 0;
    bodies.length = 0;

    score = 0;
    scoreElement.textContent = `Pontuação: ${score}`;
    resetTimer(); // Reseta o cronômetro
}

// Adiciona eventos aos botões
document.getElementById('startButton').addEventListener('click', startBallGeneration);
document.getElementById('stopButton').addEventListener('click', stopBallGeneration);
document.getElementById('resetButton').addEventListener('click', resetGame);

// Função para mover o anel com o mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function moveRingWithMouse(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 5);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    ringMesh.position.set(intersection.x, 5, intersection.z);
    ringBody.position.set(intersection.x, 5, intersection.z);
}

window.addEventListener('mousemove', moveRingWithMouse);

// Animação
const timestep = 1 / 60;

function animate() {
    world.step(timestep);

    meshes.forEach((mesh, i) => {
        mesh.position.copy(bodies[i].position);
        mesh.quaternion.copy(bodies[i].quaternion);

        const ballY = mesh.position.y;
        const ringY = ringMesh.position.y;
        const distance = Math.sqrt((mesh.position.x - ringMesh.position.x) ** 2 + (mesh.position.z - ringMesh.position.z) ** 2);

        if (ballY < ringY && distance < ringRadius && !bodies[i].hasScored) {
            bodies[i].hasScored = true;
            score++;
            scoreElement.textContent = `Pontuação: ${score}`;
        }

        if (ballY < 0 && !bodies[i].hasScored) {
            scene.remove(mesh);
            world.removeBody(bodies[i]);
            meshes.splice(i, 1);
            bodies.splice(i, 1);
        }
    });

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Redimensionamento da janela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});