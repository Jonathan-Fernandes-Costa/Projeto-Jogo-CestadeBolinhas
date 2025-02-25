import * as THREE from 'three'; // Importa a biblioteca Three.js para renderização 3D
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Importa controles de órbita para a câmera
import * as CANNON from 'cannon-es'; // Importa a biblioteca Cannon-es para simulação física

// Configuração do renderizador WebGL
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Cria um renderizador WebGL com antialiasing
renderer.setSize(window.innerWidth, window.innerHeight); // Define o tamanho do renderizador para o tamanho da janela
renderer.shadowMap.enabled = true; // Habilita o mapeamento de sombras
document.body.appendChild(renderer.domElement); // Adiciona o elemento do renderizador ao corpo do documento

// Criação da cena e configuração do fundo
const scene = new THREE.Scene(); // Cria uma nova cena 3D
scene.background = new THREE.Color(0xFFFFFF); // Define o fundo da cena como branco

// Configuração da câmera
const camera = new THREE.PerspectiveCamera(
    45, // Campo de visão em graus
    window.innerWidth / window.innerHeight, // Proporção de aspecto
    0.1, // Plano de corte próximo
    1000 // Plano de corte distante
);

// Controles de órbita para a câmera
const orbit = new OrbitControls(camera, renderer.domElement); // Cria controles de órbita para a câmera
camera.position.set(4, 15, 13); // Define a posição inicial da câmera
orbit.update(); // Atualiza os controles de órbita

// Configuração da iluminação ambiente
const ambientLight = new THREE.AmbientLight(0x333333); // Cria uma luz ambiente com cor escura
scene.add(ambientLight); // Adiciona a luz ambiente à cena

// Configuração da luz direcional
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8); // Cria uma luz direcional com intensidade 0.8
directionalLight.castShadow = true; // Habilita sombras para a luz direcional
directionalLight.shadow.mapSize.width = 1024; // Define a largura do mapa de sombras
directionalLight.shadow.mapSize.height = 1024; // Define a altura do mapa de sombras
scene.add(directionalLight); // Adiciona a luz direcional à cena
directionalLight.position.set(0, 50, 0); // Define a posição da luz direcional

// Criação do mundo físico com Cannon-es
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) }); // Cria um mundo físico com gravidade

// Criação de um plano visual com Three.js
const planeGeo = new THREE.PlaneGeometry(5, 5); // Cria a geometria do plano
const planeMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, // Cor do plano
    side: THREE.DoubleSide // Habilita a renderização de ambos os lados do plano
});
const planeMesh = new THREE.Mesh(planeGeo, planeMat); // Cria a malha do plano
planeMesh.receiveShadow = true; // Habilita sombras para o plano
// scene.add(planeMesh); // Adiciona o plano à cena (comentado para não aparecer visualmente)

// Criação de um corpo físico para o plano com Cannon-es
const planePhysMat = new CANNON.Material(); // Cria um material físico para o plano
const planeBody = new CANNON.Body({
    type: CANNON.Body.STATIC, // Define o corpo como estático
    shape: new CANNON.Box(new CANNON.Vec3(2, 2, 0.1, 22)), // Define a forma do corpo como uma caixa
    material: planePhysMat // Define o material físico
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotaciona o corpo para ficar horizontal
world.addBody(planeBody); // Adiciona o corpo físico ao mundo

// Criação da cesta
const basketGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 22); // Cria a geometria da cesta (cilindro)
const basketMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Define o material da cesta (verde)
const basketMesh = new THREE.Mesh(basketGeometry, basketMaterial); // Cria a malha da cesta
basketMesh.castShadow = true; // Habilita sombras para a cesta
basketMesh.receiveShadow = true; // Habilita sombras para a cesta
scene.add(basketMesh); // Adiciona a cesta à cena

// Posiciona a cesta acima do plano
basketMesh.position.set(0, 0, 0); // Define a posição da cesta

// Arrays para armazenar as malhas e corpos físicos das bolinhas
const meshes = [];
const bodies = [];

// Função para criar uma bola
function createBall() {
    // Gera posições aleatórias dentro dos limites do plano
    const randomX = (Math.random() - 0.5) * 10; // Gera uma posição X aleatória entre -5 e 5
    const randomZ = (Math.random() - 0.5) * 10; // Gera uma posição Z aleatória entre -5 e 5
    const randomY = 10; // Define uma altura fixa para as bolinhas caírem

    // Cria a geometria e o material da bolinha
    const sphereGeo = new THREE.SphereGeometry(0.125, 30, 30); // Cria a geometria da esfera
    const sphereMat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xFFFFFF, // Define uma cor aleatória para a bolinha
        metalness: 0, // Define o nível de metalicidade
        roughness: 0 // Define o nível de rugosidade
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat); // Cria a malha da bolinha
    sphereMesh.castShadow = true; // Habilita sombras para a bolinha
    scene.add(sphereMesh); // Adiciona a bolinha à cena
    sphereMesh.position.set(randomX, randomY, randomZ); // Define a posição aleatória da bolinha

    // Cria o corpo físico da bolinha com Cannon-es
    const spherePhysMat = new CANNON.Material(); // Cria um material físico para a bolinha
    const sphereBody = new CANNON.Body({
        mass: 0.3, // Define a massa da bolinha
        shape: new CANNON.Sphere(0.125), // Define a forma da bolinha como uma esfera
        position: new CANNON.Vec3(randomX, randomY, randomZ), // Define a posição aleatória da bolinha
        material: spherePhysMat // Define o material físico
    });
    world.addBody(sphereBody); // Adiciona o corpo físico ao mundo

    // Cria um material de contato entre o plano e a bolinha
    const planeSphereContactMat = new CANNON.ContactMaterial(
        planePhysMat,
        spherePhysMat,
        { restitution: 0.3 } // Define o coeficiente de restituição (elasticidade)
    );
    world.addContactMaterial(planeSphereContactMat); // Adiciona o material de contato ao mundo

    // Armazena a malha e o corpo físico da bolinha nos arrays
    meshes.push(sphereMesh);
    bodies.push(sphereBody);
}

// Variável para controlar o intervalo de geração de bolas
let intervalId = null;

// Função para iniciar a geração de bolas
function startBallGeneration() {
    if (intervalId) return; // Se já estiver rodando, não faz nada

    intervalId = setInterval(() => {
        createBall(); // Gera uma bola a cada intervalo
    }, 500); // Gera uma bola a cada 500ms
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

// Define o passo de tempo para a simulação física
const timestep = 1 / 60;

// Função de animação
function animate() {
    world.step(timestep); // Atualiza a simulação física

    // Atualiza a posição das bolinhas
    for (let i = 0; i < meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position); // Atualiza a posição da malha com base no corpo físico
        meshes[i].quaternion.copy(bodies[i].quaternion); // Atualiza a rotação da malha com base no corpo físico

        // Verifica colisão com a cesta
        const distance = meshes[i].position.distanceTo(basketMesh.position);
        if (distance < 1) { // Ajuste o valor conforme o tamanho da cesta
            console.log("Bolinha capturada!");
            scene.remove(meshes[i]); // Remove a bolinha da cena
            world.removeBody(bodies[i]); // Remove o corpo físico da bolinha
            meshes.splice(i, 1); // Remove da lista de malhas
            bodies.splice(i, 1); // Remove da lista de corpos
            i--; // Ajusta o índice após remover o item
        }
    }

    renderer.render(scene, camera); // Renderiza a cena
}

// Inicia o loop de animação
renderer.setAnimationLoop(animate);

// Atualiza o tamanho da câmera e do renderizador quando a janela é redimensionada
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight; // Atualiza a proporção de aspecto da câmera
    camera.updateProjectionMatrix(); // Atualiza a matriz de projeção da câmera
    renderer.setSize(window.innerWidth, window.innerHeight); // Atualiza o tamanho do renderizador
});