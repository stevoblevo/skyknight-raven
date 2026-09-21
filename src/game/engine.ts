import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { SoftAudio } from "./audio";
import {
  createAdultSae,
  createBird,
  createFragment,
  createKnight,
  makeToonRamp,
  type FragRig,
  type HeroRig,
} from "./character";
import { FRAGMENTS, type FragId, type FragmentDef } from "./fragments";
import { InputMap } from "./input";
import { hasProgress, loadSave, writeSave, type SaveData } from "./save";
import { WatchPlay } from "./watch";
import { createSky, createWorld, type WorldBits } from "./world";

export type Line = { speaker: string; text: string; portrait: string };

export type HudSnapshot = {
  started: boolean;
  pose: "stand" | "kneel" | "sit";
  near: FragmentDef | null;
  assumed: string[];
  dream: boolean;
  looking: boolean;
  hint: string;
  line: Line | null;
  assembled: boolean;
  canContinue: boolean;
  px: number;
  pz: number;
  yaw: number;
  hearts: number;
  watching: boolean;
};

type FragLive = {
  def: FragmentDef;
  rig: FragRig;
  met: boolean;
  chase: number;
  still: number;
  kneel: number;
  sit: number;
  listen: number;
  sneak: number;
  hide: number;
  pos: THREE.Vector3;
  home: THREE.Vector3;
  yaw: number;
};

const FORWARD = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const MOVE = new THREE.Vector3();
const CAM_POS = new THREE.Vector3();
const LOOK_AT = new THREE.Vector3();
const THREAD_PT = new THREE.Vector3();
const HERO_Q = new THREE.Quaternion();
const DUMMY = new THREE.Object3D();
const _up = new THREE.Vector3(0, 1, 0);

function wrapDelta(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

const SAE_LINE: Line = {
  speaker: "Sae",
  text: "Steven… I made it farther this time.",
  portrait: "/anewgam/sae-adult.jpg",
};

const QUIET_LINE: Line = {
  speaker: "Quiet",
  text: "You keep assuming we all want to become her again.",
  portrait: "/anewgam/frag-shy.jpg",
};

export class AnewgamGame {
  readonly input = new InputMap();
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(44, 1, 0.1, 320);
  private hero: HeroRig;
  private world: WorldBits;
  private sky: THREE.Mesh;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private sae: THREE.Group;
  private bird: THREE.Group;
  private frags: FragLive[] = [];
  private audio = new SoftAudio();
  private save: SaveData;
  private detachInput: () => void;
  private ro?: ResizeObserver;
  private disposed = false;
  private timer = new THREE.Timer();
  private started = false;
  private pos = new THREE.Vector3(0, 0, 8.6);
  private yaw = 0;
  private saveAcc = 0;
  private camYaw = 0;
  private viewYaw = 0;
  private lookPitch = 0.08;
  private lookFresh = 0;
  private dream = false;
  private vy = 0;
  private grounded = true;
  private coyote = 0;
  private hopBuf = 0;
  private walkPhase = 0;
  private near: FragmentDef | null = null;
  private pose: "stand" | "kneel" | "sit" = "stand";
  private lastHud = "";
  private onHud: (s: HudSnapshot) => void;
  private canvas: HTMLCanvasElement;
  private speed = 0;
  private line: Line | null = null;
  private lineT = 0;
  private assembledShown = false;
  private quietShown = false;
  private hint = "Meet them. Do not collect them.";
  private watching = false;
  private watch = new WatchPlay();
  private keepSave: SaveData | null = null;

  constructor(canvas: HTMLCanvasElement, onHud: (s: HudSnapshot) => void) {
    this.canvas = canvas;
    this.onHud = onHud;
    this.save = loadSave();
    this.audio.setMuted(this.save.muted);
    this.pos.set(this.save.x, 0, this.save.z);
    this.yaw = this.save.yaw;
    this.camYaw = this.save.yaw;
    this.viewYaw = this.save.yaw;

    const quality: "hi" | "lo" = canvas.clientWidth < 500 ? "lo" : "hi";
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality === "hi",
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "hi" ? 1.6 : 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.scene.background = new THREE.Color(0xf4b48a);
    this.scene.fog = new THREE.Fog(0xf4b48a, 28, 172);

    const hemi = new THREE.HemisphereLight(0xffd4c0, 0x5a7a48, 1.12);
    this.hemi = hemi;
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe0b0, 1.28);
    this.sun = sun;
    sun.position.set(18, 32, -28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality === "hi" ? 1024 : 512, quality === "hi" ? 1024 : 512);
    sun.shadow.camera.near = 4;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -36;
    sun.shadow.camera.right = 36;
    sun.shadow.camera.top = 36;
    sun.shadow.camera.bottom = -36;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xc4a6ff, 0.5);
    rim.position.set(-18, 12, 16);
    this.scene.add(rim);

    const ramp = makeToonRamp();
    this.sky = createSky();
    this.scene.add(this.sky);
    this.world = createWorld(this.scene, ramp, quality);
    this.hero = createKnight(ramp);
    this.scene.add(this.hero.group);
    this.sae = createAdultSae(ramp);
    this.bird = createBird(ramp);
    this.scene.add(this.sae);
    this.scene.add(this.bird);

    for (const def of FRAGMENTS) {
      const rig = createFragment(def.id, ramp);
      rig.group.position.set(def.x, 0, def.z);
      this.scene.add(rig.group);
      const met = this.save.assumed.includes(def.id);
      this.frags.push({
        def,
        rig,
        met,
        chase: 0,
        still: 0,
        kneel: 0,
        sit: 0,
        listen: 0,
        sneak: 0,
        hide: 0,
        pos: new THREE.Vector3(def.x, 0, def.z),
        home: new THREE.Vector3(def.x, 0, def.z),
        yaw: 0,
      });
    }

    this.applyWorldRewards();
    if (this.save.assembled) {
      this.sae.visible = true;
      this.assembledShown = true;
    }

    this.camera.position.set(0, 2.6, 14);
    this.detachInput = this.input.attach(canvas);
    if (quality === "hi") {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.52, 0.4, 0.74);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);

    window.__controlsTest = {
      getYaw: () => this.yaw,
      getSpeed: () => this.speed,
      setKeys: (codes) => this.input.setKeys(codes),
      getPos: () => ({ x: this.pos.x, z: this.pos.z, started: this.started }),
      getViewYaw: () => this.viewYaw,
      getLookPitch: () => this.lookPitch,
      setLookDelta: (dx, dy) => this.input.addLookDelta(dx, dy),
      setGaze: (on) => {
        this.dream = on;
      },
    };

    this.emitHud();
  }

  startLoop(): void {
    this.timer.connect(document);
    this.renderer.setAnimationLoop(() => this.tick());
  }

  enter(mode: "play" | "watch" = "play"): void {
    this.started = true;
    void this.audio.unlock();
    if (mode === "watch") this.beginWatch();
    else {
      this.watching = false;
      this.persist(true);
      this.line = {
        speaker: "Sae",
        text: "The ground is filled with little pieces of me…",
        portrait: "/anewgam/sae-portrait.jpg",
      };
      this.lineT = 6;
    }
    this.emitHud();
  }

  takeControl(): void {
    if (!this.watching) return;
    this.watching = false;
    this.keepSave = null;
    this.hint = "You took the path.";
    this.persist(true);
    this.emitHud();
  }

  canContinue(): boolean {
    return hasProgress(this.save);
  }

  setMuted(muted: boolean): void {
    this.save.muted = muted;
    this.audio.setMuted(muted);
    this.persist(true);
    this.emitHud();
  }

  isMuted(): boolean {
    return this.save.muted;
  }

  dismissLine(): void {
    this.line = null;
    this.emitHud();
  }

  tryMeet(): void {
    if (!this.near) return;
    const live = this.frags.find((f) => f.def.id === this.near?.id);
    if (!live || live.met) return;
    this.hint = live.def.how;
    this.line = {
      speaker: live.def.title,
      text: live.def.hint,
      portrait: live.def.portrait,
    };
    this.lineT = 4.5;
    this.emitHud();
  }

  private persist(force = false): void {
    if (this.watching) return;
    this.save.x = this.pos.x;
    this.save.z = this.pos.z;
    this.save.yaw = this.yaw;
    writeSave(this.save);
    void force;
  }

  private beginWatch(): void {
    this.keepSave = this.save;
    this.save = {
      version: this.keepSave.version,
      assumed: [],
      muted: this.keepSave.muted,
      x: 0,
      z: 8.6,
      yaw: 0,
      assembled: false,
    };
    this.watching = true;
    this.watch.reset();
    this.pos.set(0, 0, 8.6);
    this.yaw = 0;
    this.camYaw = 0;
    this.viewYaw = 0;
    this.lookPitch = 0.22;
    this.dream = false;
    this.pose = "stand";
    this.assembledShown = false;
    this.quietShown = false;
    this.input.standUp();
    for (const live of this.frags) {
      live.met = false;
      live.chase = 0;
      live.still = 0;
      live.kneel = 0;
      live.sit = 0;
      live.listen = 0;
      live.sneak = 0;
      live.hide = 0;
      live.pos.copy(live.home);
      live.pos.y = 0;
    }
    this.sae.visible = false;
    this.applyWorldRewards();
    this.hint = "Watching the play. Touch a stick to join.";
  }

  private rewindWatchCast(): void {
    this.save.assumed = [];
    this.save.assembled = false;
    this.assembledShown = false;
    this.quietShown = false;
    for (const live of this.frags) {
      live.met = false;
      live.chase = 0;
      live.still = 0;
      live.kneel = 0;
      live.sit = 0;
      live.listen = 0;
      live.sneak = 0;
      live.hide = 0;
      live.pos.copy(live.home);
      live.pos.y = 0;
    }
    this.sae.visible = false;
    this.applyWorldRewards();
  }

  dispose(): void {
    this.persist();
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.detachInput();
    this.ro?.disconnect();
    this.audio.dispose();
    this.timer.disconnect();
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    if (window.__controlsTest) delete window.__controlsTest;
  }

  private resize(): void {
    const parent = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.bloom?.setSize(w, h);
  }

  private tick(): void {
    if (this.disposed) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    this.update(dt);
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  private update(dt: number): void {
    let act = this.input.sample();
    if (this.started && this.watching && this.input.playerIntent()) this.takeControl();
    if (this.started) {
      if (this.watching) {
        const drive = this.watch.drive(dt, this.pos, this.camYaw);
        if (drive.looped) this.rewindWatchCast();
        act = {
          ...act,
          moveX: drive.moveX,
          moveY: drive.moveY,
          hop: false,
          hopPressed: false,
          interactPressed: false,
          lookPressed: false,
          kneel: drive.pose === "kneel",
          sit: drive.pose === "sit",
          lookX: 0,
          lookY: 0,
          lookDx: 0,
          lookDy: 0,
        };
        this.input.kneelHeld = drive.pose === "kneel";
        this.input.sitHeld = drive.pose === "sit";
        this.dream = drive.dream;
        this.pose = drive.pose;
        if (drive.lookYaw !== null) {
          this.viewYaw += wrapDelta(drive.lookYaw, this.viewYaw) * (1 - Math.exp(-3.4 * dt));
          this.lookFresh = 1.1;
        }
        if (drive.lookPitch !== null) {
          this.lookPitch += (drive.lookPitch - this.lookPitch) * (1 - Math.exp(-3.4 * dt));
          this.lookFresh = 1.1;
        }
        if (drive.line) {
          this.line = drive.line;
          this.lineT = 5.2;
        }
      }
      const movingStick = Math.hypot(act.moveX, act.moveY) > 0.1;
      if (movingStick && !this.watching) this.input.standUp();
      if (act.kneel) this.pose = "kneel";
      else if (this.input.sitHeld) this.pose = "sit";
      else this.pose = "stand";

      if (act.hopPressed) this.hopBuf = 0.14;
      this.hopBuf = Math.max(0, this.hopBuf - dt);
      if (this.grounded) this.coyote = 0.12;
      else this.coyote = Math.max(0, this.coyote - dt);
      if (this.hopBuf > 0 && this.coyote > 0) {
        this.vy = 5.6;
        this.grounded = false;
        this.coyote = 0;
        this.hopBuf = 0;
        this.pose = "stand";
        this.input.kneelHeld = false;
        this.input.sitHeld = false;
      }

      const w = Math.max(1, this.canvas.clientWidth);
      const h = Math.max(1, this.canvas.clientHeight);
      const pointerLook = this.input.lookPointer || Math.abs(act.lookDx) + Math.abs(act.lookDy) > 0;
      this.viewYaw -= act.lookX * 2.05 * dt + act.lookDx * (Math.PI / w);
      this.lookPitch -= act.lookDy * (Math.PI / h);
      this.lookPitch += act.lookY * 1.55 * dt;
      this.lookPitch = Math.min(1.15, Math.max(-0.42, this.lookPitch));
      const lookInput = pointerLook || Math.abs(act.lookX) + Math.abs(act.lookY) > 0.04;
      if (lookInput) this.lookFresh = 1.2;
      else this.lookFresh = Math.max(0, this.lookFresh - dt);

      if (pointerLook) this.camYaw = this.viewYaw;
      else {
        const snap = lookInput ? 12 : 5;
        this.camYaw += wrapDelta(this.viewYaw, this.camYaw) * (1 - Math.exp(-snap * dt));
      }
      FORWARD.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      RIGHT.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));

      const canMove = this.pose !== "sit";
      const speedMul = this.pose === "kneel" ? 0.42 : this.dream ? 0.72 : 1;
      if (canMove) {
        MOVE.copy(FORWARD).multiplyScalar(act.moveY).addScaledVector(RIGHT, act.moveX);
        const mag = MOVE.length();
        if (mag > 0.001) {
          MOVE.multiplyScalar(1 / mag);
          const walk = 4.15 * speedMul;
          this.pos.addScaledVector(MOVE, walk * dt);
          this.speed = walk * mag;
          this.yaw = Math.atan2(-MOVE.x, -MOVE.z);
          this.walkPhase += dt * 9 * mag;
        } else {
          this.speed = 0;
          this.walkPhase += dt * 1.4;
        }
      } else {
        this.speed = 0;
        MOVE.set(0, 0, 0);
      }

      if (!this.dream && this.lookFresh <= 0 && this.speed > 0.45) {
        this.lookPitch += (0.08 - this.lookPitch) * (1 - Math.exp(-1.7 * dt));
        this.viewYaw += wrapDelta(this.yaw, this.viewYaw) * (1 - Math.exp(-1.4 * dt));
      }

      this.saveAcc += dt;
      if (this.saveAcc > 2.4) {
        this.saveAcc = 0;
        this.persist();
      }

      const span = Math.hypot(this.pos.x, this.pos.z);
      if (span > 54) this.pos.multiplyScalar(54 / span);

      this.vy -= 18 * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= 0) {
        this.pos.y = 0;
        this.vy = 0;
        this.grounded = true;
      } else this.grounded = false;

      if (act.lookPressed) this.dream = !this.dream;
      if (act.interactPressed) this.tryMeet();
    } else {
      this.speed = 0;
      this.walkPhase += dt * 1.2;
      FORWARD.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    }

    if (this.lineT > 0) {
      this.lineT -= dt;
      if (this.lineT <= 0) this.line = null;
    }

    this.animateHero(dt);
    this.updateFragments(dt);
    this.animateWorld(dt);
    this.updateCamera();
    this.updateNear();
    this.updateStory();
    this.emitHud();
  }

  private meet(live: FragLive): void {
    if (live.met) return;
    live.met = true;
    if (!this.save.assumed.includes(live.def.id)) {
      this.save.assumed = [...this.save.assumed, live.def.id];
    }
    this.audio.chime();
    this.line = {
      speaker: live.def.title,
      text: live.def.meet,
      portrait: live.def.portrait,
    };
    this.lineT = 5.5;
    this.hint = `${live.def.title} returned by choice. ${this.save.assumed.length} / 5`;
    this.applyWorldRewards();
    if (this.save.assumed.length >= 5 && !this.save.assembled) {
      this.save.assembled = true;
    }
    this.persist(true);
  }

  private applyWorldRewards(): void {
    const have = (id: FragId) => this.save.assumed.includes(id);
    this.world.stones.visible = have("shy");
    this.world.bloom.visible = have("crying") || have("playful");
    this.world.lanterns.visible = have("singing");
    this.world.shelter.visible = have("mischievous");
  }

  private updateFragments(dt: number): void {
    const t = this.timer.getElapsed();
    const assumed = this.save.assumed;
    for (const live of this.frags) {
      const dist = Math.hypot(live.pos.x - this.pos.x, live.pos.z - this.pos.z);
      live.hide = Math.max(0, live.hide - dt);

      if (live.met) {
        const idx = Math.max(0, assumed.indexOf(live.def.id));
        const n = Math.max(1, assumed.length);
        const a = (idx / n) * Math.PI * 2 + t * 0.55;
        const r = this.save.assembled ? 1.05 : 1.45;
        const targetX = this.save.assembled
          ? this.sae.position.x + Math.cos(a) * r
          : this.pos.x + Math.cos(a) * r;
        const targetZ = this.save.assembled
          ? this.sae.position.z + Math.sin(a) * r
          : this.pos.z + Math.sin(a) * r;
        const targetY = this.save.assembled ? 1.55 + Math.sin(t * 2 + idx) * 0.1 : 1.42 + Math.sin(t * 2 + idx) * 0.1;
        live.pos.x += (targetX - live.pos.x) * (1 - Math.exp(-3.2 * dt));
        live.pos.z += (targetZ - live.pos.z) * (1 - Math.exp(-3.2 * dt));
        live.pos.y += (targetY - live.pos.y) * (1 - Math.exp(-3.2 * dt));
      } else {
        this.behave(live, dist, dt, t);
        live.pos.y += (0 - live.pos.y) * (1 - Math.exp(-6 * dt));
      }

      live.rig.group.position.copy(live.pos);
      const lookX = live.met ? this.pos.x : this.pos.x;
      const lookZ = live.met ? this.pos.z : this.pos.z;
      live.rig.group.lookAt(lookX, live.pos.y, lookZ);
      const bob = Math.sin(t * 3 + live.def.x) * 0.04;
      live.rig.torso.position.y = 0.42 + bob;
      if (!live.met) {
        live.rig.leftArm.rotation.x = Math.sin(t * 4 + live.def.x) * 0.25;
        live.rig.rightArm.rotation.x = -Math.sin(t * 4 + live.def.x) * 0.25;
      }
    }
  }

  private behave(live: FragLive, dist: number, dt: number, t: number): void {
    const id = live.def.id;
    const approaching = this.speed > 1.15 && dist < 8;

    if (id === "playful") {
      if (approaching && this.pose === "stand") {
        live.chase += dt;
        live.still = 0;
        const awayX = live.pos.x - this.pos.x;
        const awayZ = live.pos.z - this.pos.z;
        const m = Math.hypot(awayX, awayZ) || 1;
        live.pos.x += (awayX / m) * 3.4 * dt;
        live.pos.z += (awayZ / m) * 3.4 * dt;
      } else {
        live.pos.x += Math.sin(t * 1.4) * 0.6 * dt;
        live.pos.z += Math.cos(t * 1.1) * 0.6 * dt;
        if (live.chase > 1.4 && this.speed < 0.4 && dist < 9.5) {
          live.still += dt;
          if (live.still > 1.55) this.meet(live);
        } else if (this.speed < 0.4) live.chase = Math.max(0, live.chase - dt * 0.35);
      }
      return;
    }

    if (id === "shy") {
      if (this.pose !== "kneel" && dist < 3.4 && this.speed > 0.45) {
        const awayX = live.pos.x - this.pos.x;
        const awayZ = live.pos.z - this.pos.z;
        const m = Math.hypot(awayX, awayZ) || 1;
        live.pos.x += (awayX / m) * 1.8 * dt;
        live.pos.z += (awayZ / m) * 1.8 * dt;
        live.kneel = 0;
      } else if (this.pose === "kneel" && dist < 4.6 && this.speed < 0.55) {
        live.kneel += dt;
        if (live.kneel > 2.0) {
          live.pos.x += (this.pos.x - live.pos.x) * 0.6 * dt;
          live.pos.z += (this.pos.z - live.pos.z) * 0.6 * dt;
          if (live.kneel > 2.5) this.meet(live);
        }
      } else live.kneel = Math.max(0, live.kneel - dt * 0.4);
      return;
    }

    if (id === "crying") {
      live.pos.x += (live.home.x - live.pos.x) * 0.8 * dt;
      live.pos.z += (live.home.z - live.pos.z) * 0.8 * dt;
      if (this.pose === "sit" && dist < 3.5) {
        live.sit += dt;
        if (live.sit > 2.15) this.meet(live);
      } else live.sit = Math.max(0, live.sit - dt * 0.3);
      return;
    }

    if (id === "singing") {
      live.pos.x = live.home.x + Math.sin(t * 0.5) * 0.4;
      live.pos.z = live.home.z + Math.cos(t * 0.4) * 0.4;
      if (this.dream && dist < 5.6) {
        live.listen += dt;
        if (live.listen > 2.0) this.meet(live);
      } else if (this.speed > 2.4 && dist < 1.4) live.listen *= 0.4;
      else live.listen = Math.max(0, live.listen - dt * 0.2);
      return;
    }

    if (id === "mischievous") {
      if (live.hide > 0) {
        live.pos.x += Math.sin(t * 6) * 0.4 * dt;
        return;
      }
      if (this.pose !== "kneel" && dist < 5.4 && this.speed > 1.7) {
        live.hide = 2.8;
        live.sneak = 0;
        const a = t * 7;
        live.pos.x = live.home.x + Math.cos(a) * 3.2;
        live.pos.z = live.home.z + Math.sin(a) * 3.2;
        this.hint = "She startled. Crouch, then sneak.";
        return;
      }
      if (this.pose === "kneel" && dist < 3.3) {
        live.sneak += dt;
        if (live.sneak > 1.05) this.meet(live);
      } else live.sneak = Math.max(0, live.sneak - dt * 0.3);
    }
  }

  private animateHero(dt: number): void {
    const g = this.hero.group;
    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    const targetQuat = HERO_Q.setFromAxisAngle(_up, this.yaw + Math.PI);
    g.quaternion.slerp(targetQuat, 1 - Math.exp(-8 * dt));

    const moving = this.speed > 0.4;
    const swing = moving ? Math.sin(this.walkPhase) * 0.5 : Math.sin(this.walkPhase * 0.5) * 0.05;
    this.hero.leftArm.rotation.x = swing;
    this.hero.rightArm.rotation.x = -swing;
    this.hero.leftLeg.rotation.x = -swing * 0.85;
    this.hero.rightLeg.rotation.x = swing * 0.85;
    this.hero.cape.rotation.x = moving ? 0.12 + Math.sin(this.walkPhase) * 0.06 : 0.04;

    if (this.pose === "sit") {
      this.hero.torso.rotation.x = 0.42;
      this.hero.leftLeg.rotation.x = -1.15;
      this.hero.rightLeg.rotation.x = -1.15;
      g.position.y = this.pos.y - 0.22;
    } else if (this.pose === "kneel") {
      this.hero.torso.rotation.x = 0.18;
      this.hero.leftLeg.rotation.x = -0.85;
      this.hero.rightLeg.rotation.x = -0.2;
      g.position.y = this.pos.y - 0.14;
    } else {
      this.hero.torso.rotation.x = moving ? Math.sin(this.walkPhase * 2) * 0.03 : this.dream ? -0.08 : 0;
    }

    FORWARD.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    RIGHT.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (this.save.assembled) {
      this.sae.visible = true;
      this.sae.lookAt(this.pos.x, this.sae.position.y, this.pos.z);
    }

    const bx = this.save.assembled ? this.sae.position.x + 0.3 : 2.4;
    const bz = this.save.assembled ? this.sae.position.z + 0.2 : -4.2;
    const by = 1.4 + Math.sin(this.timer.getElapsed() * 3) * 0.12;
    this.bird.position.x += (bx - this.bird.position.x) * (1 - Math.exp(-2.2 * dt));
    this.bird.position.z += (bz - this.bird.position.z) * (1 - Math.exp(-2.2 * dt));
    this.bird.position.y += (by - this.bird.position.y) * (1 - Math.exp(-3 * dt));
    this.bird.lookAt(this.pos.x, 1.2, this.pos.z);
  }

  private animateWorld(dt: number): void {
    const t = this.timer.getElapsed();
    const pos = this.world.petals.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < this.world.petalVel.length; i += 1) {
      arr[i * 3] += Math.sin(t + i) * 0.25 * dt;
      arr[i * 3 + 1] -= this.world.petalVel[i] * dt;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3] = this.pos.x + (Math.random() - 0.5) * 40;
        arr[i * 3 + 1] = 6 + Math.random() * 6;
        arr[i * 3 + 2] = this.pos.z + (Math.random() - 0.5) * 40;
      }
    }
    pos.needsUpdate = true;

    const sparkArr = (this.world.sparks.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array;
    const n = sparkArr.length / 3;
    for (let i = 0; i < n; i += 1) {
      const u = (t * 0.06 + i / n) % 1;
      this.world.pathCurve.getPointAt(u, THREAD_PT);
      sparkArr[i * 3] = THREAD_PT.x + Math.sin(t * 3 + i) * 0.12;
      sparkArr[i * 3 + 1] = THREAD_PT.y + 0.28 + Math.sin(t * 5 + i) * 0.1;
      sparkArr[i * 3 + 2] = THREAD_PT.z + Math.cos(t * 3 + i) * 0.12;
    }
    this.world.sparks.geometry.attributes.position.needsUpdate = true;
    this.world.sparks.visible = this.save.assumed.includes("singing") || this.dream;

    this.world.rings.forEach((ring, i) => {
      const id = FRAGMENTS[i]?.id;
      if (!id) return;
      ring.visible = !this.save.assumed.includes(id);
      ring.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08);
    });

    for (let i = 0; i < 28; i += 1) {
      const a = t * 0.4 + i * 0.9;
      DUMMY.position.set(Math.cos(a) * (8 + (i % 5) * 3), 0.8 + Math.sin(t * 2 + i) * 0.35, Math.sin(a) * (8 + (i % 4) * 3) - 6);
      DUMMY.rotation.set(0, a, Math.sin(t * 8 + i) * 0.6);
      DUMMY.updateMatrix();
      this.world.butterflies.setMatrixAt(i, DUMMY.matrix);
    }
    this.world.butterflies.instanceMatrix.needsUpdate = true;

    const mat = this.sky.material as THREE.ShaderMaterial;
    const want = this.dream ? 1.24 : 1.14;
    this.renderer.toneMappingExposure += (want - this.renderer.toneMappingExposure) * 0.04;
    if (this.bloom) {
      const strength = this.dream ? 0.68 : this.save.assembled ? 0.58 : 0.48;
      this.bloom.strength += (strength - this.bloom.strength) * 0.06;
    }
    void mat;
    void dt;
  }

  private updateCamera(): void {
    const gazing = this.dream;
    const dist = gazing ? 9.6 : 6.5;
    const height = gazing ? 3.05 : 2.38;
    const yaw = this.camYaw;
    CAM_POS.set(
      this.pos.x + Math.sin(yaw) * dist,
      this.pos.y + height,
      this.pos.z + Math.cos(yaw) * dist,
    );
    const dragLook = this.input.lookPointer || this.lookFresh > 0.25;
    if (dragLook) this.camera.position.copy(CAM_POS);
    else this.camera.position.lerp(CAM_POS, gazing ? 0.08 : 0.14);

    const ahead = gazing ? 5.2 : 2.4;
    const lift = 1.18 + this.lookPitch * 7.2;
    LOOK_AT.set(
      this.pos.x - Math.sin(yaw) * ahead,
      this.pos.y + Math.max(0.2, lift),
      this.pos.z - Math.cos(yaw) * ahead,
    );
    this.camera.lookAt(LOOK_AT);
    const targetFov = gazing ? 52 : 44;
    this.camera.fov += (targetFov - this.camera.fov) * 0.1;
    this.camera.updateProjectionMatrix();
  }

  private updateNear(): void {
    let best: FragmentDef | null = null;
    let bestD = Infinity;
    for (const live of this.frags) {
      if (live.met) continue;
      const d = Math.hypot(live.pos.x - this.pos.x, live.pos.z - this.pos.z);
      if (d < live.def.radius && d < bestD) {
        best = live.def;
        bestD = d;
      }
    }
    this.near = best;
    if (best) this.hint = best.hint;
    else if (this.save.assembled) this.hint = "Beyond this path lies our future.";
    else this.hint = "Meet them. Do not collect them.";
  }

  private updateStory(): void {
    if (this.save.assembled && !this.assembledShown) {
      this.assembledShown = true;
      this.sae.visible = true;
      this.line = SAE_LINE;
      this.lineT = 8;
      this.audio.hum();
    }
    if (this.save.assembled && !this.quietShown) {
      const dx = this.pos.x + 16;
      const dz = this.pos.z + 30;
      if (Math.hypot(dx, dz) < 4.5) {
        this.quietShown = true;
        this.line = QUIET_LINE;
        this.lineT = 8;
      }
    }
  }

  private emitHud(): void {
    const looking = this.dream || this.lookFresh > 0.05;
    const snap: HudSnapshot = {
      started: this.started,
      pose: this.pose,
      near: this.near,
      assumed: this.save.assumed,
      dream: this.dream,
      looking,
      hint: this.hint,
      line: this.line,
      assembled: this.save.assembled,
      canContinue: hasProgress(this.save),
      px: this.pos.x,
      pz: this.pos.z,
      yaw: this.yaw,
      hearts: this.save.assumed.length,
      watching: this.watching,
    };
    const key = JSON.stringify(snap);
    if (key === this.lastHud) return;
    this.onHud(snap);
    this.lastHud = key;
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
      getPos?: () => { x: number; z: number; started: boolean };
      getViewYaw?: () => number;
      getLookPitch?: () => number;
      setLookDelta?: (dx: number, dy: number) => void;
      setGaze?: (on: boolean) => void;
    };
  }
}

