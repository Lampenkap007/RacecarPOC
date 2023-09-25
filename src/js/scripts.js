import * as THREE from "three";
import * as YUKA from "yuka";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(document.body.offsetWidth, document.body.offsetHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

renderer.setClearColor(0xffffff);

const camera = new THREE.PerspectiveCamera(
  45,
  document.body.offsetWidth / document.body.offsetHeight,
  0.1,
  1000
);

camera.position.set(0, 10, 4);
camera.lookAt(scene.position);

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);

// const vehicleGeometry = new THREE.ConeBufferGeometry(0.1, 0.5, 8);
// vehicleGeometry.rotateX(Math.PI * 0.5);
// const vehicleMaterial = new THREE.MeshNormalMaterial();
// const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
// vehicleMesh.matrixAutoUpdate = false;
// scene.add(vehicleMesh);

const vehicle = new YUKA.Vehicle();

vehicle.boundingRadius = 1.9;

vehicle.smoother = new YUKA.Smoother(30);

vehicle.scale.set(0.3, 0.3, 0.3);

function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

const obstacleGeometry = new THREE.BoxBufferGeometry();
obstacleGeometry.computeBoundingSphere();
const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0xee0808 });

const obstacleMesh1 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
scene.add(obstacleMesh1);
obstacleMesh1.position.set(-4, 0, 0);

const obstacleMesh2 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
scene.add(obstacleMesh2);
obstacleMesh2.position.set(4, 0, 0);

const obstacle1 = new YUKA.GameEntity();
obstacle1.position.copy(obstacleMesh1.position);
obstacle1.boundingRadius = obstacleGeometry.boundingSphere.radius;
entityManager.add(obstacle1);

const obstacle2 = new YUKA.GameEntity();
obstacle2.position.copy(obstacleMesh2.position);
obstacle2.boundingRadius = obstacleGeometry.boundingSphere.radius;
entityManager.add(obstacle2);

const obstacles = [];
obstacles.push(obstacle1, obstacle2);

const obstacleAvoidanceBehavior = new YUKA.ObstacleAvoidanceBehavior(obstacles);
vehicle.steering.add(obstacleAvoidanceBehavior);

const loader = new GLTFLoader();
const group = new THREE.Group();
loader.load("./assets/Low-Poly-Racing-Car.glb", function (glb) {
  const model = glb.scene;
  model.matrixAutoUpdate = false;
  group.add(model);
  scene.add(group);
  vehicle.setRenderComponent(model, sync);
});

// const targetGeometry = new THREE.SphereGeometry(0.1);
// const targetMaterial = new THREE.MeshPhongMaterial({color: 0xFFEA00});
// const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
// targetMesh.matrixAutoUpdate = false;
// scene.add(targetMesh);

const target = new YUKA.GameEntity();
//target.setRenderComponent(targetMesh, sync);
entityManager.add(target);

const arriveBehavior = new YUKA.ArriveBehavior(target.position, 3, 0.5);
vehicle.steering.add(arriveBehavior);

vehicle.position.set(0, 0, -5);

vehicle.maxSpeed = 3;

const targetPosition = new THREE.Vector2();

window.addEventListener("scroll", function (e) {
  targetPosition.x = Math.sin(
    (this.window.scrollY / this.document.body.offsetHeight) * 20 - 5
  );
  targetPosition.y =
    (this.window.scrollY /
      (this.window.innerHeight - this.document.body.offsetHeight)) *
      2 +
    1;
  //   console.log(Math.sin(this.window.scrollY));
  console.log((this.window.scrollY / this.document.body.offsetHeight) * 20 - 5);
});

const planeGeo = new THREE.PlaneGeometry(25, 25);
const planeMat = new THREE.MeshBasicMaterial({ visible: false });
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.rotation.x = -0.5 * Math.PI;
scene.add(planeMesh);
planeMesh.name = "plane";

const raycaster = new THREE.Raycaster();

window.addEventListener("scroll", function () {
  raycaster.setFromCamera(targetPosition, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.name === "plane")
      target.position.set(intersects[i].point.x, 0, intersects[i].point.z);
  }
});

// setInterval(function(){
//     const x = Math.random() * 3;
//     const y = Math.random() * 3;
//     const z = Math.random() * 3;

//     target.position.set(x, y, z);
// }, 2000);

const time = new YUKA.Time();

function animate(t) {
  const delta = time.update().getDelta();
  entityManager.update(delta);
  // group.position.y = 0.05 * Math.sin(t / 500);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
