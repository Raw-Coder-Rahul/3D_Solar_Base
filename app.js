import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/renderers/CSS2DRenderer.js";

let scene, camera, renderer, labelRenderer, controls;
let planet_sun, planet_mercury, planet_venus, planet_earth, planet_mars;
let planet_jupiter, planet_saturn, planet_uranus, planet_neptune;
const planets = [];

let speedMultiplier = 1;
let moon;

const orbitData = [
  { name: 'mercury', radius: 70, period: 88 },
  { name: 'venus', radius: 95, period: 225 },
  { name: 'earth', radius: 120, period: 365 },
  { name: 'mars', radius: 150, period: 687 },
  { name: 'jupiter', radius: 190, period: 4333 },
  { name: 'saturn', radius: 240, period: 10759 },
  { name: 'uranus', radius: 290, period: 30687 },
  { name: 'neptune', radius: 340, period: 60190 }
];

function setSkySphere() {
  const texture = new THREE.TextureLoader().load('../assets/space/starfield_8k.jpg');
  const geometry = new THREE.SphereGeometry(1000, 64, 64);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  scene.add(new THREE.Mesh(geometry, material));
}

function loadPlanet(texturePath, radius, segments, label, meshType = 'standard') {
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const texture = new THREE.TextureLoader().load(texturePath);
  const material = meshType === 'standard'
    ? new THREE.MeshStandardMaterial({ map: texture })
    : new THREE.MeshBasicMaterial({ map: texture });
  const planet = new THREE.Mesh(geometry, material);

  if (label) addLabelToPlanet(planet, label);
  planets.push(planet);
  return planet;
}

function addLabelToPlanet(planet, name) {
  const div = document.createElement('div');
  div.className = 'label';
  div.textContent = name;
  div.style.color = 'white';
  div.style.fontSize = '12px';
  div.style.fontWeight = 'bold';
  const label = new CSS2DObject(div);
  planet.add(label);
}

function createSaturnRing(planet_saturn) {
  const texture = new THREE.TextureLoader().load('../assets/saturn_ring_8k.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const geometry = new THREE.RingGeometry(9.5, 11.5, 254);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0, 0); // Centered relative to Saturn

  planet_saturn.add(ring); // Attach it to Saturn so it rotates and orbits with it
}

function createOrbitRing(innerRadius) {
  const outerRadius = innerRadius + 0.5;
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 100);
  const material = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
}

function init() {
  scene = new THREE.Scene();
  // camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 2000);
  // camera.position.z = 100;

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 150, 150); // elevated Y for better top view
  camera.lookAt(0, 0, 0);
  setSkySphere();

  planet_sun     = loadPlanet("../assets/sun_8k.jpg", 20, 100, 'Sun', 'basic');
  planet_mercury = loadPlanet("../assets/mercury_8k.jpg", 2, 100, 'Mercury');
  planet_venus   = loadPlanet("../assets/venus_8k.jpg", 3, 100, 'Venus');
  planet_earth   = loadPlanet("../assets/earth_8K.jpg", 4, 100, 'Earth');
  moon = loadPlanet("../assets/moon.jpg", 1, 64, 'Moon');
  scene.add(moon);
  planet_mars    = loadPlanet("../assets/mars_8k.jpg", 3.5, 100, 'Mars');
  planet_jupiter = loadPlanet("../assets/jupiter_8k.jpg", 10, 100, 'Jupiter');
  planet_saturn  = loadPlanet("../assets/saturn_8k.jpg", 8, 100, 'Saturn');
  planet_uranus  = loadPlanet("../assets/uranus_8k.jpg", 6, 100, 'Uranus');
  planet_neptune = loadPlanet("../assets/neptune_8k.jpg", 5, 100, 'Neptune');

  scene.add(planet_sun, planet_mercury, planet_venus, planet_earth, planet_mars,
            planet_jupiter, planet_saturn, planet_uranus, planet_neptune);

  createSaturnRing(planet_saturn);
  planet_sun.position.set(0, 0, 0);
  orbitData.forEach(data => createOrbitRing(data.radius));

  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0);
  sunLight.position.copy(planet_sun.position);
  scene.add(sunLight);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.id = "c";

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 20;
  controls.maxDistance = 1000;

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("click", onClick);
}

function planetRevolver(time, period, planet, orbitRadius) {
  const earthYearMs = 60 * 1000; // 1 Earth year = 60 seconds of simulation
  const angle = (time * speedMultiplier / earthYearMs) * (2 * Math.PI / period);
  planet.position.x = planet_sun.position.x + orbitRadius * Math.cos(angle);
  planet.position.z = planet_sun.position.z + orbitRadius * Math.sin(angle);
}

function animate(time) {
  requestAnimationFrame(animate);

  const rotationSpeed = 0.005;
  planets.forEach(p => p.rotation.y += rotationSpeed);

  planetRevolver(time, 88, planet_mercury, 70);
  planetRevolver(time, 225, planet_venus, 95);
  planetRevolver(time, 365, planet_earth, 120);
  planetRevolver(time, 687, planet_mars, 150);
  planetRevolver(time, 4333, planet_jupiter, 190);
  planetRevolver(time, 10759, planet_saturn, 240);
  planetRevolver(time, 30687, planet_uranus, 290);
  planetRevolver(time, 60190, planet_neptune, 340);

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  if (planet_earth && moon) {
  const moonAngle = time * 0.001 * 1; // 1=12 Adjust speed to ~12 orbits/year
  const moonDistance = 8;
  moon.position.x = planet_earth.position.x + moonDistance * Math.cos(moonAngle);
  moon.position.z = planet_earth.position.z + moonDistance * Math.sin(moonAngle);
 }
}
function onClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const target = intersects[0].object.position;
    controls.target.copy(target);
  }

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate(0);

document.addEventListener("DOMContentLoaded", () => {
  const speedSelect = document.getElementById("speedSelect");
  if (speedSelect) {
    speedSelect.addEventListener("change", (e) => {
      speedMultiplier = parseFloat(e.target.value);
    });
  }
});