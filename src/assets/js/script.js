import * as THREE from 'three'; // Importa a biblioteca Three.js para criar cenas 3D.
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Importa os controles de órbita para mover a câmera.
import * as CANNON from 'cannon-es'; // Importa a biblioteca Cannon.js para física 

// Cria o renderizador WebGL com antialiasing para suavizar as bordas.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight); // Define o tamanho do renderizador para o tamanho da janela.
document.body.appendChild(renderer.domElement); // Adiciona o elemento do renderizador ao corpo do documento.

// Define a cor de fundo da cena.
renderer.setClearColor(0xFEFEFE);

// Cria a cena 3D.
const scene = new THREE.Scene();

// Cria uma câmera perspectiva com um campo de visão de 45 graus, proporção de aspecto da janela, plano de corte próximo de 0.1 e plano de corte distante de 1000.
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

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFF, 0.8);
scene.add(directionalLight);
directionalLight.position.set(0, 50, 0);

// const helper = new THREE.AxesHelper(20);
// scene.add(helper);

const world = new CANNON.World({gravity: new CANNON.Vec3(0, -9.81, 0)});

const planeGeo = new THREE.PlaneGeometry(10, 10);
const planeMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide
});

const planeBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(3, 5, 0.001))
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(planeBody);

const mouse = new THREE.Vector2();
const intersectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', function(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerWidth) * 2 + 1;
    planeNormal.copy(camera.position).normalize();
    plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, intersectionPoint);
});

window.addEventListener('click', function(e) {
    const sphereGeo = new THREE.SphereGeometry(0.125, 30, 30);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xFFEA00,
        metalness: 0,
        roughness: 0
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMat);
    sphereMesh.position.copy(intersectionPoint);
});

// Cria um grid helper de 12x12 para ajudar na visualização do espaço 3D.
const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper); // Adiciona o grid helper à cena.

// Cria um helper de eixos com comprimento de 4 para visualizar os eixos X, Y e Z.
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper); // Adiciona o helper de eixos à cena.

// Função de animação que renderiza a cena a cada frame.
function animate() {
    renderer.render(scene, camera); // Renderiza a cena com a câmera atual.
}

// Define o loop de animação para chamar a função `animate` continuamente.
renderer.setAnimationLoop(animate);

// Adiciona um listener para redimensionar a cena quando a janela for redimensionada.
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight; // Atualiza a proporção de aspecto da câmera.
    camera.updateProjectionMatrix(); // Atualiza a matriz de projeção da câmera.
    renderer.setSize(window.innerWidth, window.innerHeight); // Atualiza o tamanho do renderizador.
});