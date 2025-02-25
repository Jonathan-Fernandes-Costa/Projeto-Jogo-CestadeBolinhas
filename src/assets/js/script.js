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

// Arrays para armazenar bolinhas
const meshes = [];
const bodies = [];

// Sistema de pontuação
let score = 0;
const scoreElement = document.getElementById('score');

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
}

function stopBallGeneration() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

document.getElementById('startButton').addEventListener('click', startBallGeneration);
document.getElementById('stopButton').addEventListener('click', stopBallGeneration);

// Função para mover o anel com o mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function moveRingWithMouse(event) {
    // Obtém a posição do mouse normalizada (-1 a 1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Define o raio a partir da câmera na direção do mouse
    raycaster.setFromCamera(mouse, camera);

    // Calcula a interseção do raio com o plano Y = 5 (altura do anel)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 5);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Atualiza a posição do anel (malha visual e corpo físico)
    ringMesh.position.set(intersection.x, 5, intersection.z);
    ringBody.position.set(intersection.x, 5, intersection.z);
}

window.addEventListener('mousemove', moveRingWithMouse);

// Animação
const timestep = 1 / 60;

function animate() {
    world.step(timestep);

    for (let i = 0; i < meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);

        // Verifica se a bolinha passou pelo anel
        const ballY = meshes[i].position.y;
        const ringY = ringMesh.position.y;
        const ballX = meshes[i].position.x;
        const ballZ = meshes[i].position.z;
        const ringX = ringMesh.position.x;
        const ringZ = ringMesh.position.z;

        // Distância entre a bolinha e o centro do anel
        const distance = Math.sqrt((ballX - ringX) ** 2 + (ballZ - ringZ) ** 2);

        // Se a bolinha estiver dentro do raio do anel e abaixo dele, conta o ponto
        if (ballY < ringY && distance < ringRadius && !bodies[i].hasScored) {
            bodies[i].hasScored = true; // Marca que a bolinha já pontuou
            score++; // Incrementa a pontuação
            scoreElement.textContent = `Pontuação: ${score}`; // Atualiza o texto da pontuação
        }

        // Remove bolinhas que caíram muito
        if (ballY < -10) {
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