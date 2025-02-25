// Importação das bibliotecas necessárias
import * as THREE from 'three'; // Biblioteca para renderização 3D
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Controle de câmera orbitável
import * as CANNON from 'cannon-es'; // Biblioteca para simulação física

// Configuração do renderizador WebGL
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Cria um renderizador com antialiasing
renderer.setSize(window.innerWidth, window.innerHeight); // Define o tamanho do renderizador para o tamanho da janela
renderer.shadowMap.enabled = true; // Habilita o mapeamento de sombras
document.body.appendChild(renderer.domElement); // Adiciona o renderizador ao corpo do documento

// Criação da cena 3D
const scene = new THREE.Scene(); // Cria uma nova cena
scene.background = new THREE.Color(0xFFFFFF); // Define a cor de fundo da cena como branco

// Configuração da câmera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Cria uma câmera perspectiva
camera.position.set(10, 20, 0); // Posiciona a câmera em (10, 20, 0)
const orbit = new OrbitControls(camera, renderer.domElement); // Adiciona controles de órbita à câmera
orbit.update(); // Atualiza os controles da câmera

// Configuração da iluminação
const ambientLight = new THREE.AmbientLight(0x333333); // Adiciona uma luz ambiente para iluminação global
scene.add(ambientLight); // Adiciona a luz ambiente à cena

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8); // Adiciona uma luz direcional
directionalLight.castShadow = true; // Habilita sombras para a luz direcional
directionalLight.position.set(0, 50, 0); // Posiciona a luz direcional em (0, 50, 0)
scene.add(directionalLight); // Adiciona a luz direcional à cena

// Configuração do mundo físico (Cannon-es)
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) }); // Cria um mundo físico com gravidade apontando para baixo

// Criação do anel (torus)
const ringRadius = 1; // Raio do anel
const ringThickness = 0.1; // Espessura do anel
const ringGeometry = new THREE.TorusGeometry(ringRadius, ringThickness, 16, 100); // Cria a geometria do anel
const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 }); // Define o material do anel (cor laranja)
const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial); // Cria a malha do anel
ringMesh.castShadow = true; // Habilita sombras para o anel
ringMesh.receiveShadow = true; // Permite que o anel receba sombras
ringMesh.position.set(0, 5, 0); // Posiciona o anel em (0, 5, 0)
ringMesh.rotation.x = Math.PI / 2; // Rotaciona o anel para ficar na horizontal
scene.add(ringMesh); // Adiciona o anel à cena

const ringPhysMat = new CANNON.Material(); // Define o material físico do anel
const ringBody = new CANNON.Body({
    type: CANNON.Body.STATIC, // Define o corpo como estático (não se move)
    shape: new CANNON.Cylinder(ringRadius, ringRadius, ringThickness, 32), // Define a forma do corpo como um cilindro
    material: ringPhysMat // Aplica o material físico
});
ringBody.position.set(0, 5, 0); // Posiciona o corpo físico do anel
ringBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotaciona o corpo físico para corresponder à malha
world.addBody(ringBody); // Adiciona o corpo físico ao mundo

// Criação do chão
const groundGeometry = new THREE.PlaneGeometry(20, 20); // Cria a geometria do chão
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide }); // Define o material do chão (cor cinza)
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial); // Cria a malha do chão
groundMesh.receiveShadow = true; // Permite que o chão receba sombras
groundMesh.rotation.x = -Math.PI / 2; // Rotaciona o chão para ficar na horizontal
scene.add(groundMesh); // Adiciona o chão à cena

const groundPhysMat = new CANNON.Material(); // Define o material físico do chão
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC, // Define o corpo como estático
    shape: new CANNON.Plane(), // Define a forma do corpo como um plano
    material: groundPhysMat // Aplica o material físico
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotaciona o corpo físico para corresponder à malha
world.addBody(groundBody); // Adiciona o corpo físico ao mundo

// Arrays para armazenar as bolinhas
const meshes = []; // Armazena as malhas das bolinhas
const bodies = []; // Armazena os corpos físicos das bolinhas

// Sistema de pontuação
let score = 0; // Variável para armazenar a pontuação
const scoreElement = document.getElementById('score'); // Referência ao elemento HTML que exibe a pontuação

// Sistema de cronômetro
let startTime = null; // Armazena o tempo inicial
let elapsedTime = 0; // Armazena o tempo decorrido
let timerInterval = null; // Armazena o intervalo do cronômetro
const timerElement = document.getElementById('timer'); // Referência ao elemento HTML que exibe o tempo

// Função para atualizar o cronômetro
function updateTimer() {
    const currentTime = Date.now(); // Obtém o tempo atual
    elapsedTime = currentTime - startTime; // Calcula o tempo decorrido
    const seconds = Math.floor(elapsedTime / 1000); // Converte para segundos
    const milliseconds = Math.floor((elapsedTime % 1000) / 10); // Converte para milissegundos
    timerElement.textContent = `Tempo: ${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`; // Atualiza o texto do cronômetro
}

// Função para iniciar o cronômetro
function startTimer() {
    if (timerInterval) return; // Evita múltiplos intervalos
    startTime = Date.now() - elapsedTime; // Define o tempo inicial
    timerInterval = setInterval(updateTimer, 10); // Inicia o intervalo de atualização
}

// Função para parar o cronômetro
function stopTimer() {
    clearInterval(timerInterval); // Limpa o intervalo
    timerInterval = null; // Reseta o intervalo
}

// Função para resetar o cronômetro
function resetTimer() {
    stopTimer(); // Para o cronômetro
    elapsedTime = 0; // Reseta o tempo decorrido
    timerElement.textContent = 'Tempo: 00:00'; // Atualiza o texto do cronômetro
}

// Função para criar uma bola
function createBall() {
    const randomX = (Math.random() - 0.5) * 10; // Gera uma posição X aleatória
    const randomZ = (Math.random() - 0.5) * 10; // Gera uma posição Z aleatória
    const randomY = 10; // Define a posição Y fixa

    const sphereGeo = new THREE.SphereGeometry(0.2, 30, 30); // Cria a geometria da bola
    const sphereMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xFFFFFF }); // Define o material da bola com cor aleatória
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat); // Cria a malha da bola
    sphereMesh.castShadow = true; // Habilita sombras para a bola
    scene.add(sphereMesh); // Adiciona a bola à cena
    sphereMesh.position.set(randomX, randomY, randomZ); // Posiciona a bola

    const spherePhysMat = new CANNON.Material(); // Define o material físico da bola
    const sphereBody = new CANNON.Body({
        mass: 0.3, // Define a massa da bola
        shape: new CANNON.Sphere(0.2), // Define a forma da bola como uma esfera
        position: new CANNON.Vec3(randomX, randomY, randomZ), // Posiciona o corpo físico
        material: spherePhysMat // Aplica o material físico
    });
    world.addBody(sphereBody); // Adiciona o corpo físico ao mundo

    meshes.push(sphereMesh); // Armazena a malha da bola
    bodies.push(sphereBody); // Armazena o corpo físico da bola
}

// Controle de geração de bolinhas
let intervalId = null; // Armazena o ID do intervalo de geração de bolinhas

// Função para iniciar a geração de bolinhas
function startBallGeneration() {
    if (intervalId) return; // Evita múltiplos intervalos
    intervalId = setInterval(createBall, 500); // Gera uma bola a cada 500ms
    startTimer(); // Inicia o cronômetro
}

// Função para parar a geração de bolinhas
function stopBallGeneration() {
    if (intervalId) {
        clearInterval(intervalId); // Limpa o intervalo
        intervalId = null; // Reseta o intervalo
    }
    stopTimer(); // Para o cronômetro
}

// Função para resetar o jogo
function resetGame() {
    meshes.forEach(mesh => scene.remove(mesh)); // Remove todas as bolinhas da cena
    bodies.forEach(body => world.removeBody(body)); // Remove todos os corpos físicos do mundo
    meshes.length = 0; // Limpa o array de malhas
    bodies.length = 0; // Limpa o array de corpos físicos

    score = 0; // Reseta a pontuação
    scoreElement.textContent = `Pontuação: ${score}`; // Atualiza o texto da pontuação
    resetTimer(); // Reseta o cronômetro
}

// Adiciona eventos aos botões
document.getElementById('startButton').addEventListener('click', startBallGeneration); // Inicia a geração de bolinhas
document.getElementById('stopButton').addEventListener('click', stopBallGeneration); // Para a geração de bolinhas
document.getElementById('resetButton').addEventListener('click', resetGame); // Reseta o jogo

// Função para mover o anel com o mouse
const raycaster = new THREE.Raycaster(); // Cria um raycaster para detectar interseções
const mouse = new THREE.Vector2(); // Armazena a posição do mouse

function moveRingWithMouse(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; // Converte a posição X do mouse para coordenadas normalizadas
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // Converte a posição Y do mouse para coordenadas normalizadas

    raycaster.setFromCamera(mouse, camera); // Define o raio do raycaster com base na posição do mouse

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 5); // Cria um plano para interseção
    const intersection = new THREE.Vector3(); // Armazena o ponto de interseção
    raycaster.ray.intersectPlane(plane, intersection); // Calcula a interseção entre o raio e o plano

    ringMesh.position.set(intersection.x, 5, intersection.z); // Move a malha do anel
    ringBody.position.set(intersection.x, 5, intersection.z); // Move o corpo físico do anel
}

window.addEventListener('mousemove', moveRingWithMouse); // Adiciona o evento de movimento do mouse

// Animação
const timestep = 1 / 60; // Define o passo de tempo para a simulação física

function animate() {
    world.step(timestep); // Avança a simulação física

    // Atualiza a posição e rotação das bolinhas
    meshes.forEach((mesh, i) => {
        mesh.position.copy(bodies[i].position); // Atualiza a posição da malha com base no corpo físico
        mesh.quaternion.copy(bodies[i].quaternion); // Atualiza a rotação da malha com base no corpo físico

        const ballY = mesh.position.y; // Obtém a posição Y da bola
        const ringY = ringMesh.position.y; // Obtém a posição Y do anel
        const distance = Math.sqrt((mesh.position.x - ringMesh.position.x) ** 2 + (mesh.position.z - ringMesh.position.z) ** 2); // Calcula a distância entre a bola e o anel

        // Verifica se a bola passou pelo anel
        if (ballY < ringY && distance < ringRadius && !bodies[i].hasScored) {
            bodies[i].hasScored = true; // Marca a bola como pontuada
            score++; // Incrementa a pontuação
            scoreElement.textContent = `Pontuação: ${score}`; // Atualiza o texto da pontuação
        }

        // Remove a bola se cair abaixo do chão
        if (ballY < 0 && !bodies[i].hasScored) {
            scene.remove(mesh); // Remove a malha da cena
            world.removeBody(bodies[i]); // Remove o corpo físico do mundo
            meshes.splice(i, 1); // Remove a malha do array
            bodies.splice(i, 1); // Remove o corpo físico do array
        }
    });

    renderer.render(scene, camera); // Renderiza a cena
}

renderer.setAnimationLoop(animate); // Inicia o loop de animação

// Redimensionamento da janela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; // Atualiza a proporção da câmera
    camera.updateProjectionMatrix(); // Atualiza a matriz de projeção da câmera
    renderer.setSize(window.innerWidth, window.innerHeight); // Atualiza o tamanho do renderizador
});