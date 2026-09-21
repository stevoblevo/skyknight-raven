import * as THREE from "three";
import type { FragId } from "./fragments";

export type HeroRig = {
  group: THREE.Group;
  torso: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  cape: THREE.Object3D;
};

export type FragRig = {
  id: FragId;
  group: THREE.Group;
  torso: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
};

function mat(color: number, toon: THREE.Texture): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: toon });
}

export function makeToonRamp(): THREE.DataTexture {
  const data = new Uint8Array([48, 88, 132, 176, 220, 255]);
  const tex = new THREE.DataTexture(data, 6, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createKnight(toon: THREE.Texture): HeroRig {
  const steel = mat(0x1c1c28, toon);
  const plate = mat(0x2a2a38, toon);
  const gold = mat(0xc9a227, toon);
  const skin = mat(0xd4a090, toon);
  const hair = mat(0x1a1410, toon);
  const cape = mat(0x14141c, toon);
  const leather = mat(0x3a2418, toon);

  const group = new THREE.Group();
  group.name = "knight";

  const torso = new THREE.Group();
  torso.position.y = 1.08;
  group.add(torso);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.62, 10), steel);
  chest.position.y = 0.06;
  chest.castShadow = true;
  torso.add(chest);
  const breast = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), plate);
  breast.scale.set(1.05, 0.85, 0.7);
  breast.position.set(0, 0.12, 0.08);
  breast.castShadow = true;
  torso.add(breast);

  const filigree = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 6, 14), gold);
  filigree.rotation.x = Math.PI / 2;
  filigree.position.y = 0.18;
  torso.add(filigree);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), gold);
  star.position.set(0, 0.16, 0.26);
  torso.add(star);

  const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), steel);
  pauldronL.scale.set(1.15, 0.7, 1);
  pauldronL.position.set(-0.3, 0.28, 0);
  torso.add(pauldronL);
  const pauldronR = pauldronL.clone();
  pauldronR.position.x = 0.3;
  torso.add(pauldronR);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skin);
  head.position.set(0, 0.58, 0.04);
  head.castShadow = true;
  torso.add(head);
  const hairMain = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), hair);
  hairMain.scale.set(1.05, 1.15, 1.15);
  hairMain.position.set(0, 0.64, -0.02);
  hairMain.castShadow = true;
  torso.add(hairMain);
  const bang = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hair);
  bang.scale.set(1.5, 0.55, 0.8);
  bang.position.set(0, 0.7, 0.1);
  torso.add(bang);
  for (const s of [-1, 1]) {
    const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.18, 3, 6), hair);
    lock.position.set(s * 0.14, 0.52, 0.02);
    lock.rotation.z = s * 0.35;
    torso.add(lock);
  }

  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.34, 0.22, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 3, 6), steel);
    upper.position.y = -0.18;
    upper.castShadow = true;
    pivot.add(upper);
    const gaunt = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), gold);
    gaunt.position.y = -0.38;
    pivot.add(gaunt);
    torso.add(pivot);
    return pivot;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const makeLeg = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.12, 0.78, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 3, 6), plate);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    pivot.add(thigh);
    const boot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), leather);
    boot.position.set(0, -0.48, 0.04);
    boot.scale.set(1, 0.65, 1.35);
    pivot.add(boot);
    group.add(pivot);
    return pivot;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), steel);
  hips.scale.set(1.15, 0.55, 0.85);
  hips.position.y = 0.82;
  group.add(hips);

  const capePivot = new THREE.Group();
  capePivot.position.set(0, 1.28, -0.08);
  const capeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.15, 8, 1, true), cape);
  capeMesh.position.set(0, -0.52, -0.18);
  capeMesh.rotation.x = 0.28;
  capeMesh.castShadow = true;
  capePivot.add(capeMesh);
  const capeTrim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 5, 12), gold);
  capeTrim.rotation.x = Math.PI / 2;
  capePivot.add(capeTrim);
  group.add(capePivot);

  return { group, torso, leftArm, rightArm, leftLeg, rightLeg, cape: capePivot };
}

export function createFragment(id: FragId, toon: THREE.Texture): FragRig {
  const skin = mat(0xf3c4b0, toon);
  const hair = mat(0xc4683a, toon);
  const dress = mat(0xf2b4c8, toon);
  const dressDeep = mat(0xe08aa8, toon);
  const gold = mat(0xe8c56a, toon);
  const group = new THREE.Group();
  group.name = id;
  group.scale.setScalar(0.72);

  const torso = new THREE.Group();
  torso.position.y = 0.42;
  group.add(torso);

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 10), dress);
  skirt.position.y = -0.02;
  skirt.castShadow = true;
  torso.add(skirt);
  const bodice = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), dressDeep);
  bodice.scale.set(1.1, 0.85, 0.8);
  bodice.position.y = 0.18;
  torso.add(bodice);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin);
  head.position.set(0, 0.4, 0.04);
  head.castShadow = true;
  torso.add(head);
  const hairMain = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), hair);
  hairMain.scale.set(1.15, 1.2, 1.2);
  hairMain.position.set(0, 0.44, -0.02);
  hairMain.castShadow = true;
  torso.add(hairMain);
  for (const s of [-1, 1]) {
    const curl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), hair);
    curl.position.set(s * 0.14, 0.34, 0.02);
    torso.add(curl);
  }
  const circlet = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 5, 12), gold);
  circlet.rotation.x = Math.PI / 2;
  circlet.position.set(0, 0.54, 0.02);
  torso.add(circlet);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe6a8 }));
    eye.position.set(s * 0.045, 0.42, 0.15);
    torso.add(eye);
  }

  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.18, 0.16, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 3, 6), skin);
    arm.position.y = -0.12;
    pivot.add(arm);
    torso.add(pivot);
    return pivot;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  if (id === "playful") {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), gold);
    star.position.set(0.16, 0.08, 0.12);
    torso.add(star);
    rightArm.rotation.z = -0.8;
  } else if (id === "shy") {
    leftArm.rotation.z = 1.1;
    rightArm.rotation.z = -1.1;
    leftArm.rotation.x = -0.6;
    rightArm.rotation.x = -0.6;
  } else if (id === "crying") {
    const tear = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: 0xa8d4ff }));
    tear.position.set(0.05, 0.36, 0.16);
    torso.add(tear);
  } else if (id === "singing") {
    const note = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), gold);
    note.position.set(0.22, 0.42, 0.1);
    torso.add(note);
  } else {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 5), gold);
    crown.position.set(0, 0.62, 0);
    torso.add(crown);
  }

  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), dress);
  hips.position.y = 0.28;
  group.add(hips);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.16, 3, 5), skin);
    leg.position.set(s * 0.07, 0.16, 0);
    group.add(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), mat(0xf7efe4, toon));
    shoe.position.set(s * 0.07, 0.04, 0.02);
    shoe.scale.set(1, 0.55, 1.2);
    group.add(shoe);
  }

  const glow = new THREE.PointLight(0xffc8d8, 0.45, 3.4);
  glow.position.y = 0.7;
  group.add(glow);

  return { id, group, torso, leftArm, rightArm };
}

export function createAdultSae(toon: THREE.Texture): THREE.Group {
  const skin = mat(0xf3c4b0, toon);
  const hair = mat(0xc4683a, toon);
  const dress = mat(0xe8a8bc, toon);
  const lace = mat(0xf7efe8, toon);
  const gold = mat(0xe8c56a, toon);
  const group = new THREE.Group();
  group.name = "sae";

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.05, 12), dress);
  skirt.position.y = 0.72;
  skirt.castShadow = true;
  group.add(skirt);
  const bodice = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), lace);
  bodice.scale.set(1.05, 0.9, 0.75);
  bodice.position.y = 1.28;
  group.add(bodice);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), skin);
  head.position.set(0, 1.62, 0.04);
  head.castShadow = true;
  group.add(head);
  const hairMain = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), hair);
  hairMain.scale.set(1.15, 1.25, 1.2);
  hairMain.position.set(0, 1.68, -0.04);
  group.add(hairMain);
  for (const s of [-1, 1]) {
    const fall = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.7, 4, 8), hair);
    fall.position.set(s * 0.16, 1.18, -0.08);
    fall.rotation.set(0.4, 0, s * 0.22);
    group.add(fall);
  }
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), gold);
  jewel.position.set(0, 1.82, 0.08);
  group.add(jewel);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.38, 3, 6), skin);
    arm.position.set(s * 0.28, 1.18, 0.04);
    arm.rotation.z = s * 0.35;
    group.add(arm);
  }
  group.visible = false;
  group.position.set(0, 0, -28);
  return group;
}

export function createBird(toon: THREE.Texture): THREE.Group {
  const blue = mat(0x3d8fd4, toon);
  const breast = mat(0xf0a07a, toon);
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), blue);
  body.scale.set(1.4, 0.95, 1.7);
  group.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), breast);
  chest.position.set(0, -0.01, 0.09);
  group.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), blue);
  head.position.set(0, 0.07, 0.14);
  group.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 5), mat(0xe8c56a, toon));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.05, 0.2);
  group.add(beak);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.CircleGeometry(0.09, 8), blue);
    wing.position.set(s * 0.1, 0.02, 0);
    wing.rotation.y = s * 0.7;
    group.add(wing);
  }
  group.position.set(1.2, 1.6, 6.4);
  return group;
}
