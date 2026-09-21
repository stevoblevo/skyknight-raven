import * as THREE from "three";
import { asset } from "@/lib/asset";
import { FRAGMENTS } from "./fragments";

export type WorldBits = {
  petals: THREE.Points;
  petalVel: Float32Array;
  sparks: THREE.Points;
  pathCurve: THREE.CatmullRomCurve3;
  rings: THREE.Mesh[];
  stones: THREE.Group;
  shelter: THREE.Group;
  bloom: THREE.Group;
  lanterns: THREE.Group;
  butterflies: THREE.InstancedMesh;
  arch: THREE.Group;
  castle: THREE.Group;
};

const VISTAS = [
  "anewgam/vista-castle.jpg",
  "anewgam/vista-meadow.jpg",
  "anewgam/vista-arch.jpg",
  "anewgam/vista-lanterns.jpg",
  "anewgam/vista-terraces.jpg",
  "anewgam/vista-portal.jpg",
  "anewgam/vista-lake.jpg",
  "anewgam/vista-garden.jpg",
  "anewgam/vista-isles.jpg",
  "anewgam/vista-orchard.jpg",
  "anewgam/vista-stars.jpg",
  "anewgam/vista-wong.jpg",
].map(asset);

export function createSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(140, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uHorizon: { value: new THREE.Color(0xf4b48a) },
      uZenith: { value: new THREE.Color(0x6a4a8c) },
      uGlow: { value: new THREE.Color(0xffd080) },
    },
    vertexShader: `
      varying vec3 vN;
      void main() {
        vN = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vN;
      uniform vec3 uHorizon;
      uniform vec3 uZenith;
      uniform vec3 uGlow;
      void main() {
        float h = clamp(vN.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uHorizon, uZenith, smoothstep(0.16, 0.88, h));
        float band = pow(1.0 - abs(vN.y - 0.05), 10.0);
        col += uGlow * band * 0.42;
        vec3 sunDir = normalize(vec3(0.22, 0.12, -0.72));
        float sun = pow(max(dot(normalize(vN), sunDir), 0.0), 36.0);
        float halo = pow(max(dot(normalize(vN), sunDir), 0.0), 7.0);
        col += uGlow * (sun * 1.45 + halo * 0.32);
        float nx = floor(vN.x * 7.0);
        float nz = floor(vN.z * 7.0);
        float n = fract(sin(dot(vec2(nx, nz), vec2(12.9898, 78.233))) * 43758.5453);
        float clouds = smoothstep(0.48, 0.84, n) * smoothstep(0.26, 0.58, h) * (1.0 - smoothstep(0.74, 1.0, h));
        col = mix(col, vec3(1.0, 0.88, 0.82), clouds * 0.42);
        float stars = step(0.996, fract(sin(dot(vN.xz * 52.0, vec2(12.9898, 78.233))) * 43758.5453)) * smoothstep(0.52, 0.94, h);
        col += vec3(1.0, 0.95, 0.85) * stars;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

function mulberry(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toon(color: number, ramp: THREE.Texture): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: ramp });
}

function makePathRibbon(curve: THREE.CatmullRomCurve3, width: number, segments: number): THREE.BufferGeometry {
  const pts = curve.getSpacedPoints(segments);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const len = Math.max(1, segments);
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    if (i < pts.length - 1) tan.subVectors(pts[i + 1], p);
    else tan.subVectors(p, pts[i - 1]);
    tan.y = 0;
    if (tan.lengthSq() < 1e-8) tan.set(0, 0, -1);
    else tan.normalize();
    side.copy(up).cross(tan).normalize().multiplyScalar(width * 0.5);
    const y = 0.045;
    positions.push(p.x - side.x, y, p.z - side.z, p.x + side.x, y, p.z + side.z);
    const v = (i / len) * 10;
    uvs.push(0, v, 1, v);
    if (i > 0) {
      const a = (i - 1) * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createWorld(scene: THREE.Scene, ramp: THREE.Texture, quality: "hi" | "lo"): WorldBits {
  const grass = toon(0x6f8f4e, ramp);
  const bark = toon(0x6a4332, ramp);
  const blossomA = toon(0xf3b7c2, ramp);
  const blossomB = toon(0xf7d0d6, ramp);
  const blossomC = toon(0xe58aa0, ramp);
  blossomA.emissive = new THREE.Color(0x3a1020);
  blossomA.emissiveIntensity = 0.22;
  blossomB.emissive = new THREE.Color(0x2a1820);
  blossomB.emissiveIntensity = 0.14;
  blossomC.emissive = new THREE.Color(0x401018);
  blossomC.emissiveIntensity = 0.22;
  const gold = new THREE.MeshStandardMaterial({
    color: 0xe8c56a,
    roughness: 0.35,
    metalness: 0.55,
    emissive: 0x3a2808,
    emissiveIntensity: 0.28,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe8d4b8,
    roughness: 0.82,
    metalness: 0.05,
  });

  const loader = new THREE.TextureLoader();
  const grassTex = loader.load(asset("anewgam/grass.jpg"));
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(16, 16);
  grassTex.colorSpace = THREE.SRGBColorSpace;
  grass.map = grassTex;
  grass.color = new THREE.Color(0xf4ead8);

  const stoneTex = loader.load(asset("anewgam/stone.jpg"));
  stoneTex.wrapS = THREE.RepeatWrapping;
  stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.colorSpace = THREE.SRGBColorSpace;
  stoneMat.map = stoneTex;

  const ground = new THREE.Mesh(new THREE.CircleGeometry(72, 48), grass);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const pathCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0, 10.5),
    new THREE.Vector3(0.4, 0, 4.2),
    new THREE.Vector3(-0.6, 0, -2.4),
    new THREE.Vector3(0.8, 0, -10.6),
    new THREE.Vector3(-0.4, 0, -18.8),
    new THREE.Vector3(0.2, 0, -28.4),
    new THREE.Vector3(0, 0, -38),
  ]);
  const path = new THREE.Mesh(makePathRibbon(pathCurve, 2.35, 72), stoneMat);
  path.receiveShadow = true;
  scene.add(path);

  const rng = mulberry(2187);
  const flowerCount = quality === "hi" ? 520 : 220;
  const flowerGeo = new THREE.SphereGeometry(0.12, 6, 4);
  const flowerMat = toon(0xf4a0b8, ramp);
  flowerMat.emissive = new THREE.Color(0x401020);
  flowerMat.emissiveIntensity = 0.18;
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < flowerCount; i += 1) {
    const a = rng() * Math.PI * 2;
    const r = 4 + rng() * 42;
    dummy.position.set(Math.cos(a) * r, 0.12 + rng() * 0.08, Math.sin(a) * r);
    dummy.scale.setScalar(0.45 + rng() * 0.9);
    dummy.rotation.set(rng() * 0.4, rng() * 6, rng() * 0.4);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    const tint = rng();
    flowers.setColorAt(i, new THREE.Color(tint > 0.66 ? 0xf7d0d6 : tint > 0.33 ? 0xf3b7c2 : 0xffe6a8));
  }
  flowers.instanceMatrix.needsUpdate = true;
  if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
  flowers.castShadow = true;
  scene.add(flowers);

  const whiteCount = quality === "hi" ? 180 : 80;
  const white = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 5, 4), blossomB, whiteCount);
  for (let i = 0; i < whiteCount; i += 1) {
    const a = rng() * Math.PI * 2;
    const r = 3 + rng() * 38;
    dummy.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
    dummy.scale.setScalar(0.5 + rng() * 0.7);
    dummy.updateMatrix();
    white.setMatrixAt(i, dummy.matrix);
  }
  scene.add(white);

  const treeCount = quality === "hi" ? 22 : 12;
  for (let i = 0; i < treeCount; i += 1) {
    const a = (i / treeCount) * Math.PI * 2 + rng() * 0.4;
    const r = 18 + rng() * 22;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 4 && z < 4 && z > -36) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.2, 6), bark);
    trunk.position.set(x, 1.1, z);
    trunk.castShadow = true;
    scene.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.15 + rng() * 0.4, 8, 6), i % 2 ? blossomA : blossomC);
    canopy.position.set(x, 2.6 + rng() * 0.3, z);
    canopy.scale.set(1.3, 0.85, 1.3);
    canopy.castShadow = true;
    scene.add(canopy);
  }

  const arch = new THREE.Group();
  const pillarMat = toon(0x8a7468, ramp);
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.4, 0.55), pillarMat);
    p.position.set(s * 1.7, 2.2, 0);
    p.castShadow = true;
    arch.add(p);
  }
  const lintel = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.28, 8, 16, Math.PI), pillarMat);
  lintel.rotation.z = Math.PI;
  lintel.position.y = 4.15;
  arch.add(lintel);
  const vine = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.08, 6, 16, Math.PI), blossomA);
  vine.rotation.z = Math.PI;
  vine.position.y = 4.2;
  arch.add(vine);
  for (let i = 0; i < 18; i += 1) {
    const rose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), i % 2 ? blossomA : blossomC);
    const a = (i / 18) * Math.PI;
    rose.position.set(Math.cos(a) * 1.8, 4.15 + Math.sin(a) * 0.15, Math.sin(a) * 0.2);
    arch.add(rose);
  }
  arch.position.set(7.6, 0, -1.8);
  arch.rotation.y = -0.45;
  scene.add(arch);

  const castle = new THREE.Group();
  const wall = toon(0xc4b8d4, ramp);
  const keep = new THREE.Mesh(new THREE.BoxGeometry(7.4, 6.2, 5.2), wall);
  keep.position.y = 3.1;
  castle.add(keep);
  for (const [x, z, h] of [
    [-3.6, -1.6, 9.4],
    [3.6, -1.6, 8.6],
    [-2.2, 2.1, 7.2],
    [2.4, 2.1, 10.2],
    [0, -2.4, 12.4],
  ] as const) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, h, 8), wall);
    t.position.set(x, h / 2, z);
    castle.add(t);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 8), gold);
    spire.position.set(x, h + 0.9, z);
    castle.add(spire);
  }
  castle.position.set(0, 0, -52);
  castle.scale.setScalar(1.65);
  scene.add(castle);

  const loader2 = new THREE.TextureLoader();
  VISTAS.forEach((src, i) => {
    const tex = loader2.load(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    const n = VISTAS.length;
    const a = (i / n) * Math.PI * 2;
    const r = 60 + (i % 3) * 4;
    const x = Math.sin(a) * r;
    const z = -Math.cos(a) * r;
    const y = 12.4 + (i % 2) * 1.2;
    const w = 25;
    const h = 14.2;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: true }),
    );
    board.position.set(x, y, z);
    board.rotation.y = Math.atan2(-x, -z);
    scene.add(board);
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.55, h + 0.55),
      new THREE.MeshBasicMaterial({ color: 0xc9a227, side: THREE.DoubleSide, fog: true }),
    );
    frame.position.set(x, y, z);
    frame.rotation.y = board.rotation.y;
    frame.position.add(new THREE.Vector3(Math.sin(board.rotation.y), 0, Math.cos(board.rotation.y)).multiplyScalar(0.08));
    scene.add(frame);
    board.renderOrder = 1;
  });

  const petalCount = quality === "hi" ? 280 : 140;
  const petalGeo = new THREE.BufferGeometry();
  const petalPos = new Float32Array(petalCount * 3);
  const petalVel = new Float32Array(petalCount);
  for (let i = 0; i < petalCount; i += 1) {
    petalPos[i * 3] = (rng() - 0.5) * 50;
    petalPos[i * 3 + 1] = rng() * 10;
    petalPos[i * 3 + 2] = (rng() - 0.5) * 50;
    petalVel[i] = 0.4 + rng() * 0.8;
  }
  petalGeo.setAttribute("position", new THREE.BufferAttribute(petalPos, 3));
  const petals = new THREE.Points(
    petalGeo,
    new THREE.PointsMaterial({ color: 0xf4c4c8, size: 0.18, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  scene.add(petals);

  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(48 * 3);
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: 0xffe6a8, size: 0.16, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  scene.add(sparks);

  const rings: THREE.Mesh[] = [];
  for (const frag of FRAGMENTS) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({ color: frag.color, transparent: true, opacity: 0.7 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(frag.x, 0.08, frag.z);
    scene.add(ring);
    rings.push(ring);
  }

  const stones = new THREE.Group();
  stones.visible = false;
  for (let i = 0; i < 8; i += 1) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 8), stoneMat);
    s.position.set(-6.2 + i * 0.85, 0.06, -4.2 - i * 0.55);
    s.rotation.y = i * 0.3;
    stones.add(s);
  }
  scene.add(stones);

  const shelter = new THREE.Group();
  shelter.visible = false;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.1, 6), bark);
  roof.position.y = 1.55;
  shelter.add(roof);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6), bark);
  post.position.y = 0.6;
  shelter.add(post);
  shelter.position.set(12.4, 0, -18.6);
  scene.add(shelter);

  const bloom = new THREE.Group();
  bloom.visible = false;
  for (let i = 0; i < 40; i += 1) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), i % 2 ? blossomA : blossomC);
    const a = rng() * Math.PI * 2;
    b.position.set(Math.cos(a) * (1 + rng() * 4), 0.16, Math.sin(a) * (1 + rng() * 4));
    bloom.add(b);
  }
  bloom.position.set(6.5, 0, 5.4);
  scene.add(bloom);

  const lanterns = new THREE.Group();
  lanterns.visible = false;
  for (let i = 0; i < 6; i += 1) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), gold);
    lamp.position.set((i - 2.5) * 1.1, 1.15 + (i % 2) * 0.2, 0);
    lanterns.add(lamp);
    const light = new THREE.PointLight(0xffd080, 0.55, 4);
    light.position.copy(lamp.position);
    lanterns.add(light);
  }
  lanterns.position.set(-0.2, 0, -14.5);
  scene.add(lanterns);

  const butterflyGeo = new THREE.PlaneGeometry(0.22, 0.14);
  const butterflyMat = new THREE.MeshBasicMaterial({
    color: 0xf4c4e0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const butterflies = new THREE.InstancedMesh(butterflyGeo, butterflyMat, 28);
  scene.add(butterflies);

  return {
    petals,
    petalVel,
    sparks,
    pathCurve,
    rings,
    stones,
    shelter,
    bloom,
    lanterns,
    butterflies,
    arch,
    castle,
  };
}
