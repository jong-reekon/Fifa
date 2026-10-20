// Rotating 3D "big ears" trophy shown above the league table.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("trophy");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
// Studio-style reflections so the metal reads as polished chrome
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 2.2, 8.8);
camera.lookAt(0, 2.0, 0);

const silver = new THREE.MeshStandardMaterial({ color: 0xe8ebef, metalness: 1, roughness: 0.1, side: THREE.DoubleSide });
const trophy = new THREE.Group();

// Cup body: a profile (radius, height) spun around the vertical axis —
// bell-shaped foot, collar, urn-shaped bowl with a broad shoulder, narrow neck and flared lip
const profile = [
  [0, 0], [0.73, 0], [0.73, 0.05], [0.7, 0.14], [0.55, 0.3], [0.38, 0.42], [0.3, 0.52], [0.27, 0.62],
  [0.33, 0.66], [0.33, 0.74], [0.29, 0.78],
  [0.36, 0.84], [0.47, 1.0], [0.58, 1.2], [0.7, 1.5], [0.79, 1.8], [0.84, 2.2], [0.87, 2.6], [0.87, 2.75],
  [0.8, 2.86], [0.66, 2.93], [0.6, 2.98], [0.58, 3.12], [0.63, 3.21], [0.7, 3.27], [0.7, 3.31],
  [0.64, 3.29], [0, 3.0],
].map(([r, y]) => new THREE.Vector2(r, y));
trophy.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 128), silver));

// Rolled lip and the collar between foot and bowl
for (const [radius, tube, y] of [[0.68, 0.035, 3.29], [0.33, 0.03, 0.7]]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 128), silver);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  trophy.add(ring);
}

// Round medallion on the front of the bowl: a shallow dome inside a ring
const medallion = new THREE.Group();
const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 12, 0, Math.PI * 2, 0, 0.33), silver);
dome.rotation.x = Math.PI / 2;
dome.position.z = -0.48;
medallion.add(dome, new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 12, 64), silver));
medallion.position.set(0, 2.5, 0.86);
medallion.rotation.x = -0.06; // follow the slight lean of the bowl
trophy.add(medallion);

// Handles: each rises from the lower bowl, runs up the outside well above the rim,
// arcs over, then curls back down in an S to join the neck
const earPath = new THREE.CatmullRomCurve3([
  [0.46, 1.02], [0.64, 1.2], [0.8, 1.5], [0.93, 1.9], [1.01, 2.3], [1.07, 2.7], [1.11, 3.1], [1.12, 3.5],
  [1.07, 3.85], [0.92, 4.0], [0.72, 3.98], [0.56, 3.84], [0.5, 3.62], [0.62, 3.42], [0.8, 3.3],
  [0.88, 3.18], [0.82, 3.06], [0.58, 2.98],
].map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "centripetal");

// Band is broad where it meets the bowl and thins toward the top and the curl
const SEGMENTS = 240, RADIAL = 20;
const earRadius = u => (u < 0.55 ? THREE.MathUtils.lerp(0.105, 0.05, u / 0.55) : 0.05);
const earGeometry = new THREE.TubeGeometry(earPath, SEGMENTS, 1, RADIAL, false);
const pos = earGeometry.attributes.position;
const center = new THREE.Vector3(), v = new THREE.Vector3();
for (let i = 0; i <= SEGMENTS; i++) {
  earPath.getPointAt(i / SEGMENTS, center);
  const r = earRadius(i / SEGMENTS);
  for (let j = 0; j <= RADIAL; j++) {
    const k = i * (RADIAL + 1) + j;
    v.fromBufferAttribute(pos, k).sub(center).multiplyScalar(r).add(center);
    pos.setXYZ(k, v.x, v.y, v.z);
  }
}

for (const side of [0, Math.PI]) {
  const ear = new THREE.Mesh(earGeometry, silver);
  ear.scale.z = 0.4; // flatten into a band, like the real handles
  const pivot = new THREE.Group();
  pivot.rotation.y = side;
  pivot.add(ear);
  trophy.add(pivot);
}

scene.add(trophy);

function resize() {
  const { clientWidth: w, clientHeight: h } = canvas;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  if (!reduceMotion.matches) trophy.rotation.y += dt * 0.9;
  renderer.render(scene, camera);
});
