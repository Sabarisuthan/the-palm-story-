"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { storyProgress, within, SCENES } from "@/lib/story";

const vert = /* glsl */ `
uniform float uTime;
uniform float uSpin;
uniform float uPixel;
attribute float aSize;
attribute float aSeed;
varying float vAlpha;
void main() {
  vec3 p = position;
  float r = length(p.xz);
  float ang = atan(p.z, p.x) + uSpin * (0.6 + 1.4 / (r + 0.6)) + uTime * 0.05 * (0.5 + aSeed);
  p.x = cos(ang) * r;
  p.z = sin(ang) * r;
  p.y += sin(uTime * 0.4 + aSeed * 12.0) * 0.08 + uSpin * 0.15 * (aSeed - 0.5);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixel * (3.2 / -mv.z);
  vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 30.0));
}`;

const frag = /* glsl */ `
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(c));
  a *= a;
  gl_FragColor = vec4(vec3(1.0, 0.8, 0.5) * (0.6 + a), a * vAlpha * uOpacity);
}`;

/**
 * Three.js golden dust vortex around the box: additive point sprites that
 * spiral as you scroll (uSpin is scroll-driven; uTime adds a gentle shimmer).
 */
export default function GoldDust3D({ active, reduced, lowPower }: { active: boolean; reduced: boolean; lowPower: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setClearColor(0x000000, 0);
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.6);
    renderer.setPixelRatio(dpr);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    el.appendChild(renderer.domElement);

    const count = lowPower ? 260 : 700;
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 0.4 + Math.pow(Math.random(), 0.7) * 3.4;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.6;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.6;
      size[i] = 2 + Math.random() * 5;
      seed[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const uniforms = { uTime: { value: 0 }, uSpin: { value: 0 }, uOpacity: { value: 0 }, uPixel: { value: dpr } };
    const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(points);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.set(0, 0.6, 5.2);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!activeRef.current) return;
      const k = within(storyProgress.get(), SCENES.box);
      if (!reduced) uniforms.uTime.value += dt;
      uniforms.uSpin.value = k * 2.4;
      uniforms.uOpacity.value = Math.min(1, k / 0.15) * (1 - Math.max(0, (k - 0.9) / 0.1));
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced, lowPower]);

  return <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
