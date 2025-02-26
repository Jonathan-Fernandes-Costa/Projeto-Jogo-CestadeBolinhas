// Importação das bibliotecas necessárias
import * as THREE from 'three'; // Biblioteca para renderização 3D
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Controle de câmera orbitável
import * as CANNON from 'cannon-es'; // Biblioteca para simulação física

// Carregador de texturas
const textureLoader = new THREE.TextureLoader();

// Função para carregar textura com tratamento de erro
function loadTexture(path) {
    const texture = textureLoader.load(
        path,
        (texture) => {
            console.log('Textura carregada com sucesso:', path);
            // Configura a textura assim que for carregada
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            texture.encoding = THREE.sRGBEncoding;
        },
        undefined,
        (error) => {
            console.error('Erro ao carregar textura:', path, error);
        }
    );
    return texture;
}

// Carrega as texturas para as bolas (usando caminhos relativos ao index.html)
const texturePaths = [
    'TCom_Marble_TilesDiamond2_header.jpg',
    'TCom_Marble_TilesGeometric2_header.jpg',
    'TCom_GlassTeardrop_header.jpg',
    'TCom_Wicker_Herringbone_header.jpg',
    'TCom_Snow_Detail_header.jpg',
    'TCom_Pavement_CobblestoneForest02_header.jpg',
    'TCom_Metal_RedHotSteel_header.jpg'
];

// Carrega todas as texturas
const textures = texturePaths.map(path => loadTexture(path));

// Configuração das texturas
textures.forEach(tex => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.encoding = THREE.sRGBEncoding;
});

// Mapa de ambiente para reflexões
const envMapTexture = textures[0].clone();
envMapTexture.mapping = THREE.EquirectangularReflectionMapping;

// Configuração do renderizador WebGL
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Cria um renderizador com antialiasing
renderer.setSize(window.innerWidth, window.innerHeight); // Define o tamanho do renderizador para o tamanho da janela
renderer.shadowMap.enabled = true; // Habilita o mapeamento de sombras
document.body.appendChild(renderer.domElement); // Adiciona o renderizador ao corpo do documento

// Criação da cena 3D
const scene = new THREE.Scene(); // Cria uma nova cena
scene.background = new THREE.Color(0xFFFFFF); // Define a cor de fundo da cena como branco
scene.environment = envMapTexture; // Aplica o mapa de ambiente à cena

// Configuração da câmera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Cria uma câmera perspectiva
camera.position.set(20, 35, 0); // Aumentando a altura da câmera para ter uma visão melhor das bolas caindo
const orbit = new OrbitControls(camera, renderer.domElement); // Adiciona controles de órbita à câmera
orbit.update(); // Atualiza os controles da câmera

// Configuração da luz
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// Configuração do renderizador para melhor qualidade de sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Configuração do mundo físico (Cannon-es)
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.81, 0)
});

// Define as configurações de contato padrão do mundo
world.defaultContactMaterial = new CANNON.ContactMaterial(
    new CANNON.Material(),
    new CANNON.Material(),
    {
        friction: 0.4,
        restitution: 0.3
    }
);

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
const groundGeometry = new THREE.PlaneGeometry(40, 40); // Aumentando o tamanho do chão
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.receiveShadow = true;
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Material físico do chão com propriedades de bounce
const groundPhysMat = new CANNON.Material('groundMaterial');

const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC, // Define o corpo como estático
    shape: new CANNON.Plane(), // Define a forma do corpo como um plano
    material: groundPhysMat // Aplica o material físico
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotaciona o corpo físico para corresponder à malha
world.addBody(groundBody); // Adiciona o corpo físico ao mundo

// Criação das paredes
const wallHeight = 10;
const wallThickness = 0.5;
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, transparent: true, opacity: 0.5 });

// Parede frontal
const frontWallGeometry = new THREE.BoxGeometry(20, wallHeight, wallThickness);
const frontWallMesh = new THREE.Mesh(frontWallGeometry, wallMaterial);
frontWallMesh.position.set(0, wallHeight/2, 10);
frontWallMesh.castShadow = true;
frontWallMesh.receiveShadow = true;
scene.add(frontWallMesh);

// Parede traseira
const backWallMesh = new THREE.Mesh(frontWallGeometry, wallMaterial);
backWallMesh.position.set(0, wallHeight/2, -10);
backWallMesh.castShadow = true;
backWallMesh.receiveShadow = true;
scene.add(backWallMesh);

// Parede esquerda
const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 20);
const leftWallMesh = new THREE.Mesh(sideWallGeometry, wallMaterial);
leftWallMesh.position.set(-10, wallHeight/2, 0);
leftWallMesh.castShadow = true;
leftWallMesh.receiveShadow = true;
scene.add(leftWallMesh);

// Parede direita
const rightWallMesh = new THREE.Mesh(sideWallGeometry, wallMaterial);
rightWallMesh.position.set(10, wallHeight/2, 0);
rightWallMesh.castShadow = true;
rightWallMesh.receiveShadow = true;
scene.add(rightWallMesh);

// Física das paredes
const wallPhysMat = new CANNON.Material();

// Parede frontal física
const frontWallBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(10, wallHeight/2, wallThickness/2)),
    material: wallPhysMat
});
frontWallBody.position.set(0, wallHeight/2, 10);
world.addBody(frontWallBody);

// Parede traseira física
const backWallBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(10, wallHeight/2, wallThickness/2)),
    material: wallPhysMat
});
backWallBody.position.set(0, wallHeight/2, -10);
world.addBody(backWallBody);

// Parede esquerda física
const leftWallBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(wallThickness/2, wallHeight/2, 10)),
    material: wallPhysMat
});
leftWallBody.position.set(-10, wallHeight/2, 0);
world.addBody(leftWallBody);

// Parede direita física
const rightWallBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(wallThickness/2, wallHeight/2, 10)),
    material: wallPhysMat
});
rightWallBody.position.set(10, wallHeight/2, 0);
world.addBody(rightWallBody);

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

    // Se atingir 60 segundos (1 minuto), para o jogo
    if (seconds >= 60) {
        stopBallGeneration(); // Para a geração de bolas
        
        // Mostra mensagem de fim de jogo
        const finalScore = score;
        setTimeout(() => {
            alert(`Tempo esgotado! Pontuação final: ${finalScore}`);
            resetGame(); // Reseta o jogo após mostrar a mensagem
        }, 100);
    }
}

// Função para iniciar o cronômetro
function startTimer() {
    if (timerInterval) return; // Evita múltiplos intervalos
    startTime = Date.now() - elapsedTime; // Define o tempo inicial
    timerInterval = setInterval(updateTimer, 10); // Inicia o intervalo de atualização
}

// Função para parar o cronômetro
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Função para resetar o cronômetro
function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    timerElement.textContent = 'Tempo: 00:00';
}

// Função para criar uma bola
function createBall() {
    const randomX = (Math.random() - 0.5) * 10;
    const randomZ = (Math.random() - 0.5) * 10;
    const randomY = 30;

    // Material básico para debug
    const sphereMat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xFFFFFF,
        metalness: 0.3,
        roughness: 0.7
    });

    // Tenta aplicar uma textura aleatória
    try {
        const randomTexture = textures[Math.floor(Math.random() * textures.length)];
        if (randomTexture) {
            sphereMat.map = randomTexture;
            console.log('Textura aplicada com sucesso à bola');
        } else {
            console.log('Nenhuma textura disponível');
        }
    } catch (error) {
        console.error('Erro ao aplicar textura:', error);
    }

    const sphereGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true;
    sphereMesh.receiveShadow = true;
    scene.add(sphereMesh);
    sphereMesh.position.set(randomX, randomY, randomZ);

    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.2),
        position: new CANNON.Vec3(randomX, randomY, randomZ),
        material: new CANNON.Material(),
        linearDamping: 0.3,
        angularDamping: 0.3
    });

    sphereBody.velocity.set(
        (Math.random() - 0.5) * 1,
        0,
        (Math.random() - 0.5) * 1
    );

    world.addBody(sphereBody);
    meshes.push(sphereMesh);
    bodies.push(sphereBody);
}

// Função para criar uma bola dourada especial
function createGoldenBall() {
    const randomX = (Math.random() - 0.5) * 10;
    const randomZ = (Math.random() - 0.5) * 10;
    const randomY = 30;

    // Material dourado
    const goldenMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xFFD700,
        emissiveIntensity: 0.2
    });

    const sphereGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const sphereMesh = new THREE.Mesh(sphereGeo, goldenMaterial);
    sphereMesh.castShadow = true;
    sphereMesh.receiveShadow = true;
    scene.add(sphereMesh);
    sphereMesh.position.set(randomX, randomY, randomZ);

    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.3),
        position: new CANNON.Vec3(randomX, randomY, randomZ),
        material: new CANNON.Material(),
        linearDamping: 0.3,
        angularDamping: 0.3
    });

    sphereBody.velocity.set(
        (Math.random() - 0.5) * 1,
        0,
        (Math.random() - 0.5) * 1
    );

    sphereBody.isGolden = true;
    world.addBody(sphereBody);
    meshes.push(sphereMesh);
    bodies.push(sphereBody);
}

// Controle de geração de bolinhas
let intervalId = null;
let goldenBallInterval = null;

// Função para iniciar a geração de bolinhas
function startBallGeneration() {
    if (intervalId) return;
    intervalId = setInterval(createBall, 500);
    
    // Cria uma bola dourada a cada 5 segundos
    goldenBallInterval = setInterval(createGoldenBall, 5000);
    
    startTimer();
}

// Função para parar a geração de bolinhas
function stopBallGeneration() {
    if (intervalId) {
        clearInterval(intervalId);
        clearInterval(goldenBallInterval);
        intervalId = null;
        goldenBallInterval = null;
    }
    stopTimer();
}

// Função para resetar o jogo
function resetGame() {
    // Remove todas as bolas existentes
    meshes.forEach(mesh => scene.remove(mesh));
    bodies.forEach(body => world.removeBody(body));
    meshes.length = 0;
    bodies.length = 0;

    // Reseta a pontuação
    score = 0;
    scoreElement.textContent = `Pontuação: ${score}`;
    
    // Reseta o timer
    resetTimer();
    
    // Reseta a cor do aro
    resetRingColor();
}

// Adiciona eventos aos botões
document.getElementById('startButton').addEventListener('click', startBallGeneration); // Inicia a geração de bolinhas
document.getElementById('stopButton').addEventListener('click', stopBallGeneration); // Para a geração de bolinhas
document.getElementById('resetButton').addEventListener('click', resetGame); // Reseta o jogo

// Variável para controlar o tempo que o anel fica verde
let ringColorTimer = null;

// Função para resetar a cor do anel
function resetRingColor() {
    ringMesh.material.color.setHex(0xffa500); // Volta para a cor laranja
    ringColorTimer = null;
}

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
    world.step(timestep);

    for (let i = meshes.length - 1; i >= 0; i--) {
        const mesh = meshes[i];
        const body = bodies[i];
        
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);

        const ballY = mesh.position.y;
        const ringY = ringMesh.position.y;
        const distance = Math.sqrt((mesh.position.x - ringMesh.position.x) ** 2 + (mesh.position.z - ringMesh.position.z) ** 2);

        // Verifica se a bola passou pelo anel
        if (ballY < ringY && distance < ringRadius && !body.hasScored) {
            body.hasScored = true;
            
            if (body.isGolden) {
                score += 5;
                ringMesh.material.color.setHex(0xFFD700);
            } else {
                score++;
                ringMesh.material.color.setHex(0x00ff00);
            }
            
            scoreElement.textContent = `Pontuação: ${score}`;
            
            if (ringColorTimer) {
                clearTimeout(ringColorTimer);
            }
            ringColorTimer = setTimeout(resetRingColor, 500);
        }

        // Verifica se a bola dourada tocou o chão sem ser pontuada
        if (body.isGolden && !body.hasScored && ballY <= 0.3) {
            score = Math.max(0, score - 3);
            scoreElement.textContent = `Pontuação: ${score}`;
            body.hasScored = true;
            
            ringMesh.material.color.setHex(0xff0000);
            if (ringColorTimer) {
                clearTimeout(ringColorTimer);
            }
            ringColorTimer = setTimeout(resetRingColor, 500);
        }

        // Remove bolas que caíram demais
        if (ballY < -10) {
            scene.remove(mesh);
            world.removeBody(body);
            meshes.splice(i, 1);
            bodies.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate); // Inicia o loop de animação

// Redimensionamento da janela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; // Atualiza a proporção da câmera
    camera.updateProjectionMatrix(); // Atualiza a matriz de projeção da câmera
    renderer.setSize(window.innerWidth, window.innerHeight); // Atualiza o tamanho do renderizador
});