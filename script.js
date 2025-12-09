// ---------- Configuration ----------
const PARTICLE_COUNT = 15000;
const PARTICLE_SIZE = 4.0;

// ---------- Three.js globals ----------
let scene, camera, renderer, geometry, material, points;
const clock = new THREE.Clock();

// ---------- State ----------
let currentShape = 'heart';
let isTransitioning = false;
let transitionStartTime = 0;
const TRANSITION_DURATION = 1.4;

let targetExpansion = 0;
let expansion = 0;
let targetScale = 1;
let globalScale = 1;

// DOM
const statusEl = document.getElementById('status');
const videoEl = document.getElementById('webcam-preview');

// ---------- Initialization ----------
window.onload = () => {
  initThree();
  setupMediaPipe();
  animate();
};

// ---------- Init Three ----------
function initThree(){
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.02);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1, 1000
  );
  camera.position.z = 30;

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.domElement.id = "three-canvas";
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.left = '0px';
  renderer.domElement.style.top = '0px';
  renderer.domElement.style.zIndex = '10';
  document.body.appendChild(renderer.domElement);

  // geometry
  geometry = new THREE.BufferGeometry();
  const initial = generateShape("heart");

  const positions = new Float32Array(initial);
  const targets = new Float32Array(initial);

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("targetPosition", new THREE.BufferAttribute(targets, 3));

  // material
  material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      expansion: { value: 0 },
      scaleGlobal: { value: 1.0 },
      size: { value: PARTICLE_SIZE },
      transition: { value: 0 },
      colorValue: { value: new THREE.Color(0x00d2ff) }
    },
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  window.addEventListener("resize", onResize);

  document.getElementById("colorPicker").addEventListener("input", e => {
    material.uniforms.colorValue.value.set(e.target.value);
  });
}

function onResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---------- Shape Generator ----------
function generateShape(type){
  const arr = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++){
    const i3 = i*3;
    let x=0, y=0, z=0;

    if(type === "sphere"){
      const r = 10 * Math.cbrt(Math.random());
      const theta = Math.random()*2*Math.PI;
      const phi = Math.acos(2*Math.random()-1);
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta);
      z = r * Math.cos(phi);
    }
    else if(type === "heart"){
      const t = Math.random()*Math.PI*2;
      const r = Math.sqrt(Math.random())*0.8;

      const hx = 16*Math.pow(Math.sin(t),3);
      const hy = 13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);

      x = hx*0.75*r + (Math.random()-0.5)*0.6;
      y = hy*0.75*r + (Math.random()-0.5)*0.6;
      z = (Math.random()-0.5)*4;
    }
    else if(type === "flower"){
      const k = 4;
      const theta = Math.random()*2*Math.PI;
      const rBase = Math.cos(k*theta);
      const r = 12 * rBase * Math.sqrt(Math.random());

      x = r*Math.cos(theta);
      y = r*Math.sin(theta);
      z = (Math.random()-0.5)*5*rBase;
    }
    else if(type === "saturn"){
      if(Math.random() > 0.4){
        const angle = Math.random()*Math.PI*2;
        const dist = 12 + Math.random()*6;
        x = Math.cos(angle)*dist;
        z = Math.sin(angle)*dist;
        y = (Math.random()-0.5)*0.5;
      } else {
        const r = 7 * Math.cbrt(Math.random());
        const theta = Math.random()*2*Math.PI;
        const phi = Math.acos(2*Math.random()-1);
        x = r*Math.sin(phi)*Math.cos(theta);
        y = r*Math.sin(phi)*Math.sin(theta);
        z = r*Math.cos(phi);
      }
    }
    else if(type === "buddha"){
      const p = Math.random();
      if(p < 0.4){
        const r = 5 * Math.cbrt(Math.random());
        const theta = Math.random()*Math.PI*2;
        const phi = Math.acos(2*Math.random()-1);
        x = r*Math.sin(phi)*Math.cos(theta);
        y = r*Math.sin(phi)*Math.sin(theta) - 2;
        z = r*Math.cos(phi);
      } else if(p < 0.6){
        const r = 2.5 * Math.cbrt(Math.random());
        const theta = Math.random()*Math.PI*2;
        const phi = Math.acos(2*Math.random()-1);
        x = r*Math.sin(phi)*Math.cos(theta);
        y = r*Math.sin(phi)*Math.sin(theta) + 4.5;
        z = r*Math.cos(phi);
      } else {
        const angle = Math.random()*Math.PI*2;
        const rad = 7*Math.sqrt(Math.random());
        x = rad*Math.cos(angle);
        z = rad*Math.sin(angle);
        y = -5 + Math.random()*2;
      }
    }
    else if(type === "fireworks"){
      const r = 15 * Math.random();
      const theta = Math.random()*2*Math.PI;
      const phi = Math.acos(2*Math.random()-1);
      x = r*Math.sin(phi)*Math.cos(theta);
      y = r*Math.sin(phi)*Math.sin(theta);
      z = r*Math.cos(phi);

      if(Math.random()>0.9){
        x*=1.5; y*=1.5; z*=1.5;
      }
    }

    arr[i3] = x;
    arr[i3+1] = y;
    arr[i3+2] = z;
  }

  return arr;
}

// ---------- Shape Switch ----------
function setShape(type){
  if(!geometry) return;
  if(type === currentShape) return;

  document.querySelectorAll("#ui-container button")
    .forEach(b => b.classList.remove("active"));

  const btn = document.getElementById("btn-"+type);
  if(btn) btn.classList.add("active");

  const pos = geometry.getAttribute("position");
  const target = geometry.getAttribute("targetPosition");

  pos.array.set(target.array);
  pos.needsUpdate = true;

  const newT = generateShape(type);
  target.array.set(newT);
  target.needsUpdate = true;

  currentShape = type;
  transitionStartTime = clock.getElapsedTime();
  isTransitioning = true;
}

// ---------- MediaPipe Hands ----------
let cameraHelper = null;
let mpHands = null;

function setupMediaPipe(){

  mpHands = new Hands({
    locateFile: file =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
  });

  mpHands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  mpHands.onResults(onResults);

  try{
    cameraHelper = new cam.Camera(videoEl, {
      onFrame: async () => {
        await mpHands.send({ image: videoEl });
      },
      width: 640,
      height: 480
    });

    cameraHelper.start();

  } catch (err){
    console.error(err);
    statusEl.innerText = "Camera failed — Try HTTPS or localhost.";
  }
}

function onResults(results){
  if(statusEl.innerText.includes("Initializing")){
    statusEl.innerText = "Waiting for hands...";
  }

  if(results.multiHandLandmarks && results.multiHandLandmarks.length){
    statusEl.innerText = "Hands Detected: "+results.multiHandLandmarks.length;
    statusEl.style.color = "#9fffa7";

    const hand1 = results.multiHandLandmarks[0];
    const wrist = hand1[0];
    const tip = hand1[12];

    let d = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    let f = (d - 0.075) * 4.0;
    f = Math.max(0, Math.min(1, f));

    targetExpansion = f;

    if(results.multiHandLandmarks.length > 1){
      const hand2 = results.multiHandLandmarks[1];
      const distHands = Math.abs(hand1[0].x - hand2[0].x);
      targetScale = 0.6 + distHands*2.0;
    } else {
      targetScale = 1.0;
    }
  }
  else {
    statusEl.innerText = "No hands";
    statusEl.style.color = "#cfcfcf";
    targetExpansion = 0;
    targetScale = 1.0;
  }
}

// ---------- Animation Loop ----------
function animate(){
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  expansion += (targetExpansion - expansion)*0.12;
  globalScale += (targetScale - globalScale)*0.12;

  if(material){
    material.uniforms.time.value = t;
    material.uniforms.expansion.value = expansion;
    material.uniforms.scaleGlobal.value = globalScale;
  }

  if(isTransitioning){
    let u = (t - transitionStartTime) / TRANSITION_DURATION;
    if(u >= 1){
      u = 1;
      isTransitioning = false;
    }
    u = 1 - Math.pow(1-u, 3);
    material.uniforms.transition.value = u;
  }

  if(points){
    points.rotation.y = t*0.05;
    points.rotation.z = t*0.02;
  }

  renderer.render(scene, camera);
}
