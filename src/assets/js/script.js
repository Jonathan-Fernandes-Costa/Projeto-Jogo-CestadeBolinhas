import * as THREE from 'three'; // Importa a biblioteca Three.js para criar cenas 3D.
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Importa os controles de órbita para mover a câmera.
import * as CANNON from 'cannon-es'; // Importa a biblioteca Cannon.js para simulação de física.

// Cria o renderizador WebGL com antialiasing para suavizar as bordas.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight); // Define o tamanho do renderizador para o tamanho da janela.
document.body.appendChild(renderer.domElement); // Adiciona o elemento do renderizador ao corpo do documento.

// Cria a cena 3D e define a cor de fundo como branco.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF); // Fundo branco

// Cria uma câmera perspectiva com um campo de visão de 45 graus, proporção de aspecto da janela,
// plano de corte próximo de 0.1 e plano de corte distante de 1000.
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Cria controles de órbita para permitir que o usuário mova a câmera ao redor da cena.
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(4, 15, 13); // Define a posição inicial da câmera.
orbit.update(); // Atualiza os controles de órbita após alterar a posição da câmera.

// Adiciona luz ambiente à cena para iluminação global.
const ambientLight = new THREE.AmbientLight(0x333333); // Luz ambiente com cor escura
scene.add(ambientLight);

// Adiciona luz direcional à cena para iluminação direcionada.
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8); // Luz direcional branca com intensidade 0.8
scene.add(directionalLight);
directionalLight.position.set(0, 50, 0); // Posiciona a luz direcional acima da cena.

// Cria o mundo físico usando Cannon.js com gravidade padrão (9.81 m/s² para baixo).
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

// Cria um plano visual usando Three.js.
const planeGeo = new THREE.PlaneGeometry(10, 10); // Geometria do plano.
const planeMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, // Cor branca
    side: THREE.DoubleSide // Permite que o plano seja visível de ambos os lados.
});
const planeMesh = new THREE.Mesh(planeGeo, planeMat); // Cria a malha do plano.
scene.add(planeMesh); // Adiciona o plano à cena.

// Cria um corpo físico para o plano usando Cannon.js.
const planePhysMat = new CANNON.Material(); // Material físico do plano.
const planeBody = new CANNON.Body({
    type: CANNON.Body.STATIC, // Define o corpo como estático (não se move).
    shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.001)), // Define a forma do corpo como uma caixa.
    material: planePhysMat // Associa o material físico ao corpo.
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotaciona o corpo para ficar horizontal.
world.addBody(planeBody); // Adiciona o corpo físico ao mundo.

// Configurações para detectar a posição do mouse em 3D.
const mouse = new THREE.Vector2(); // Armazena a posição do mouse normalizada.
const intersectionPoint = new THREE.Vector3(); // Armazena o ponto de interseção do raio com o plano.
const planeNormal = new THREE.Vector3(); // Armazena a normal do plano.
const plane = new THREE.Plane(); // Define um plano para interseção.
const raycaster = new THREE.Raycaster(); // Cria um raycaster para detectar interseções.

// Listener para rastrear o movimento do mouse e calcular a interseção com o plano.
window.addEventListener('mousemove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; // Normaliza a posição X do mouse.
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; // Normaliza a posição Y do mouse.
    planeNormal.copy(camera.position).normalize(); // Calcula a normal do plano com base na posição da câmera.
    plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position); // Define o plano com a normal e um ponto coplanar.
    raycaster.setFromCamera(mouse, camera); // Define o raio do raycaster com base na posição do mouse e da câmera.
    raycaster.ray.intersectPlane(plane, intersectionPoint); // Calcula o ponto de interseção do raio com o plano.
});

// Arrays para armazenar malhas e corpos físicos.
const meshes = []; // Armazena as malhas visuais.
const bodies = []; // Armazena os corpos físicos.

// Listener para criar esferas ao clicar na tela.
window.addEventListener('click', function (e) {
    // Cria uma esfera visual usando Three.js.
    const sphereGeo = new THREE.SphereGeometry(0.125, 30, 30); // Geometria da esfera.
    const sphereMat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xFFFFFF, // Cor aleatória.
        metalness: 0, // Sem metalicidade.
        roughness: 0 // Superfície lisa.
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat); // Cria a malha da esfera.
    scene.add(sphereMesh); // Adiciona a esfera à cena.
    sphereMesh.position.copy(intersectionPoint); // Posiciona a esfera no ponto de interseção.

    // Cria um corpo físico para a esfera usando Cannon.js.
    const spherePhysMat = new CANNON.Material(); // Material físico da esfera.
    const sphereBody = new CANNON.Body({
        mass: 0.3, // Define a massa da esfera.
        shape: new CANNON.Sphere(0.125), // Define a forma da esfera.
        position: new CANNON.Vec3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z), // Posiciona a esfera.
        material: spherePhysMat // Associa o material físico ao corpo.
    });
    world.addBody(sphereBody); // Adiciona o corpo físico ao mundo.

    // Define um material de contato entre o plano e a esfera.
    const planeSphereContactMat = new CANNON.ContactMaterial(
        planePhysMat,
        spherePhysMat,
        { restitution: 0.3 } // Define a restituição (elasticidade) do contato.
    );
    world.addContactMaterial(planeSphereContactMat); // Adiciona o material de contato ao mundo.

    // Armazena a malha e o corpo físico nos arrays.
    meshes.push(sphereMesh);
    bodies.push(sphereBody);
});

// Define o passo de tempo para a simulação física.
const timestep = 1 / 60;

// Função de animação que atualiza a simulação física e renderiza a cena.
function animate() {
    world.step(timestep); // Atualiza a simulação física.

    // Sincroniza a posição e rotação do plano visual com o corpo físico.
    planeMesh.position.copy(planeBody.position);
    planeMesh.quaternion.copy(planeBody.quaternion);

    // Sincroniza a posição e rotação de todas as esferas visuais com seus corpos físicos.
    for (let i = 0; i < meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);
    }

    renderer.render(scene, camera); // Renderiza a cena.
}

// Define o loop de animação para chamar a função `animate` continuamente.
renderer.setAnimationLoop(animate);

// Listener para redimensionar a cena quando a janela for redimensionada.
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight; // Atualiza a proporção de aspecto da câmera.
    camera.updateProjectionMatrix(); // Atualiza a matriz de projeção da câmera.
    renderer.setSize(window.innerWidth, window.innerHeight); // Atualiza o tamanho do renderizador.
});