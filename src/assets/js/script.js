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

// Cesta (cilindro oco com parede)
const basketRadius = 1; // Raio da cesta reduzido
const basketHeight = 0.5; // Altura da parede da cesta reduzida
const basketWallThickness = 0.1; // Espessura da parede da cesta

// Base da cesta
const basketBaseGeometry = new THREE.CylinderGeometry(basketRadius, basketRadius, 0.1, 32);
const basketBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const basketBaseMesh = new THREE.Mesh(basketBaseGeometry, basketBaseMaterial);
basketBaseMesh.castShadow = true;
basketBaseMesh.receiveShadow = true;
basketBaseMesh.position.set(0, 0, 0);
scene.add(basketBaseMesh);

// Parede da cesta (cilindro oco)
const basketWallGeometry = new THREE.CylinderGeometry(
    basketRadius, // Raio externo
    basketRadius - basketWallThickness, // Raio interno (cria o efeito de parede)
    basketHeight, // Altura da parede
    32 // Número de segmentos
);
const basketWallMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const basketWallMesh = new THREE.Mesh(basketWallGeometry, basketWallMaterial);
basketWallMesh.castShadow = true;
basketWallMesh.receiveShadow = true;
basketWallMesh.position.set(0, basketHeight / 2, 0); // Posiciona a parede acima da base
scene.add(basketWallMesh);

// Corpo físico da cesta (base e parede)
const basketPhysMat = new CANNON.Material();

// Base física da cesta
const basketBaseBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Cylinder(basketRadius, basketRadius, 0.1, 32),
    material: basketPhysMat
});
basketBaseBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotaciona para ficar horizontal
world.addBody(basketBaseBody);

// Parede física da cesta
const basketWallBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Cylinder(basketRadius, basketRadius - basketWallThickness, basketHeight, 32),
    material: basketPhysMat
});
basketWallBody.position.set(0, basketHeight / 2, 0); // Posiciona a parede acima da base
world.addBody(basketWallBody);

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

    const sphereGeo = new THREE.SphereGeometry(0.2, 30, 30); // Raio aumentado para 0.2
    const sphereMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xFFFFFF });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true;
    scene.add(sphereMesh);
    sphereMesh.position.set(randomX, randomY, randomZ);

    const spherePhysMat = new CANNON.Material();
    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.2), // Raio aumentado para 0.2
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

// Função para mover a cesta com o mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function moveBasketWithMouse(event) {
    // Obtém a posição do mouse normalizada (-1 a 1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Define o raio a partir da câmera na direção do mouse
    raycaster.setFromCamera(mouse, camera);

    // Calcula a interseção do raio com o plano Y = 0 (chão)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Atualiza a posição da cesta (malha visual e corpo físico)
    basketBaseMesh.position.set(intersection.x, 0, intersection.z);
    basketWallMesh.position.set(intersection.x, basketHeight / 2, intersection.z);

    basketBaseBody.position.set(intersection.x, 0, intersection.z);
    basketWallBody.position.set(intersection.x, basketHeight / 2, intersection.z);
}

// Adiciona o evento de movimento do mouse
window.addEventListener('mousemove', moveBasketWithMouse);

// Animação
const timestep = 1 / 60;

function animate() {
    world.step(timestep);

    for (let i = 0; i < meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);

        // Verifica se a bolinha está dentro da cesta
        const distanceToBase = meshes[i].position.distanceTo(basketBaseMesh.position);
        const isInsideBasket = distanceToBase < basketRadius && meshes[i].position.y < basketHeight;

        if (isInsideBasket) {
            score++; // Incrementa a pontuação
            scoreElement.textContent = `Pontuação: ${score}`; // Atualiza o texto da pontuação
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