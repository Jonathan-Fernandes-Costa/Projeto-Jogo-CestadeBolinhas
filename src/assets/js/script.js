import * as THREE from 'three'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import * as CANNON from 'cannon-es'; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight); 
document.body.appendChild(renderer.domElement); 

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(4, 15, 13); 
orbit.update(); 

const ambientLight = new THREE.AmbientLight(0x333333); // Corrigido
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8); // Corrigido
scene.add(directionalLight);
directionalLight.position.set(0, 50, 0);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

const planeGeo = new THREE.PlaneGeometry(10, 10);
const planeMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide
});
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
scene.add(planeMesh);

const planePhysMat = new CANNON.Material();
const planeBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.001)),
    material: planePhysMat
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(planeBody);

const mouse = new THREE.Vector2();
const intersectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; // Corrigido
    planeNormal.copy(camera.position).normalize();
    plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, intersectionPoint);
});

const meshes = [];
const bodies = [];

window.addEventListener('click', function (e) {
    const sphereGeo = new THREE.SphereGeometry(0.125, 30, 30);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xFFFFFF,
        metalness: 0,
        roughness: 0
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh); // Corrigido
    sphereMesh.position.copy(intersectionPoint); // Descomentado

    const spherePhysMat = new CANNON.Material();
    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.125),
        position: new CANNON.Vec3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z),
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
});

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
    camera.aspect = window.innerWidth / window.innerHeight; // Corrigido
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});