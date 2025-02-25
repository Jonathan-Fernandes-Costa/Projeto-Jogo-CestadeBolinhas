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

const meshes = [];
const bodies = [];

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

    const sphereBody = new CANNON.body({
        mass: 0.3,
        sape: new CANNON.Sphere(0.125)
    });
    world.addBody(sphereBody);

    meshes.push(sphereMesh);
    bodies.push(sphereBody);
});

const timestep = 1 / 60;


function animate(){
    world.step(timestep);

    planeMesh.position.copy(planeBody.position);
    planeMesh.quaternion.copy(planeBody.quaternion);

    for(let i = 0; i < meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
    camera.aspect = this.window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

