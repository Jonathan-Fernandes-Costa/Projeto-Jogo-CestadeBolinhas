import * as THREE from 'three'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import * as CANNON from 'cannon-es'; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight); 
renderer.shadowMap.enabled = true; // Habilita sombras
document.body.appendChild(renderer.domElement); 

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF); // Fundo branco

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(4, 15, 13); 
orbit.update(); 

const ambientLight = new THREE.AmbientLight(0x333333); 
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8); 
directionalLight.castShadow = true; // Habilita sombras para a luz direcional
directionalLight.shadow.mapSize.width = 1024; // Aumenta a resolução da sombra
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);
directionalLight.position.set(0, 50, 0);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

const planeGeo = new THREE.PlaneGeometry(10, 10);
const planeMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide
});
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.receiveShadow = true; // Habilita sombras para o plano
scene.add(planeMesh);

const planePhysMat = new CANNON.Material();
const planeBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.001)),
    material: planePhysMat
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(planeBody);

const meshes = [];
const bodies = [];

// Função para criar uma bola
function createBall() {
    // Gera posições aleatórias dentro dos limites do plano
    const randomX = (Math.random() - 0.5) * 10; // Entre -5 e 5
    const randomZ = (Math.random() - 0.5) * 10; // Entre -5 e 5
    const randomY = 10; // Define uma altura fixa para as bolinhas caírem

    const sphereGeo = new THREE.SphereGeometry(0.125, 30, 30);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xFFFFFF,
        metalness: 0,
        roughness: 0
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true; // Habilita sombras para a bolinha
    scene.add(sphereMesh);
    sphereMesh.position.set(randomX, randomY, randomZ); // Define a posição aleatória

    const spherePhysMat = new CANNON.Material();
    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.125),
        position: new CANNON.Vec3(randomX, randomY, randomZ), // Define a posição aleatória
        material: spherePhysMat
    });
    world.addBody(sphereBody);

    const planeSphereContactMat = new CANNON.ContactMaterial(
        planePhysMat,
        spherePhysMat,
        { restitution: 0.3 }
    );
    world.addContactMaterial(planeSphereContactMat);

    meshes.push(sphereMesh);
    bodies.push(sphereBody);
}

// Variável para controlar o intervalo de geração de bolas
let intervalId = null;

// Função para iniciar a geração de bolas
function startBallGeneration() {
    if (intervalId) return; // Se já estiver rodando, não faz nada

    // Obtém a dificuldade selecionada
    const difficulty = document.getElementById('difficulty').value;

    // Define o intervalo de geração com base na dificuldade
    let intervalTime;
    switch (difficulty) {
        case 'easy':
            intervalTime = 1000; // 1 segundo
            break;
        case 'medium':
            intervalTime = 500; // 0.5 segundos
            break;
        case 'hard':
            intervalTime = 250; // 0.25 segundos
            break;
        default:
            intervalTime = 1000; // Padrão: fácil
    }

    intervalId = setInterval(() => {
        createBall(); // Gera uma bola a cada intervalo
    }, intervalTime);
}

// Função para parar a geração de bolas
function stopBallGeneration() {
    if (intervalId) {
        clearInterval(intervalId); // Interrompe o intervalo
        intervalId = null;
    }
}

// Adiciona o evento de clique ao botão "Iniciar"
document.getElementById('startButton').addEventListener('click', startBallGeneration);

// Adiciona o evento de clique ao botão "Parar"
document.getElementById('stopButton').addEventListener('click', stopBallGeneration);

const timestep = 1 / 60;

function animate() {
    world.step(timestep);

    planeMesh.position.copy(planeBody.position);
    planeMesh.quaternion.copy(planeBody.quaternion);

    for (let i = 0; i < meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});