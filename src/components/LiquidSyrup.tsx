"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { storyProgress, within, SCENES } from "@/lib/story";

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/**
 * Molten Karupatti: domain-warped fbm read as a viscous surface, lit with a
 * fake normal for glossy highlights. A noise-edged "liquid mask" grows from
 * the palm crown, so the leaves appear to melt into golden-brown syrup.
 */
const frag = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uReveal;
uniform float uFlow;
uniform float uDarken;
uniform vec2 uRes;
uniform vec2 uOrigin;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = rot * p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  float t = uTime * 0.045 + uFlow;

  // slow, heavy flow: domain warping
  vec2 sp = p * 0.75 + vec2(0.0, t * 0.35);
  vec2 q = vec2(fbm(sp + vec2(0.0, t)), fbm(sp + vec2(5.2, 1.3 - t * 0.8)));
  vec2 r = vec2(fbm(sp * 1.2 + 2.4 * q + vec2(1.7, 9.2) + 0.2 * t), fbm(sp * 1.2 + 2.4 * q + vec2(8.3, 2.8) - 0.15 * t));
  float f = fbm(sp * 0.9 + 2.6 * r);

  // glossy surface lighting from screen-space derivatives (soft, viscous)
  vec3 n = normalize(vec3(-dFdx(f) * uRes.x * 0.32, -dFdy(f) * uRes.y * 0.32, 1.0));
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 22.0);

  vec3 deep   = vec3(0.13, 0.055, 0.02);
  vec3 kar    = vec3(0.365, 0.09, 0.075);   // #5D1713
  vec3 amber  = vec3(0.56, 0.27, 0.09);
  vec3 gold   = vec3(0.72, 0.54, 0.26);     // #B88942
  vec3 glint  = vec3(1.0, 0.86, 0.6);

  vec3 col = mix(deep, kar, smoothstep(0.15, 0.5, f));
  col = mix(col, amber, smoothstep(0.45, 0.78, f + 0.15 * length(q)));
  col = mix(col, gold, smoothstep(0.7, 1.0, f * 0.8 + 0.35 * r.x));
  col *= 0.55 + 0.6 * diff;
  col += glint * spec * 0.55;

  // warm light from above, falloff below
  col *= mix(0.7, 1.15, smoothstep(0.0, 1.0, vUv.y));
  col = mix(col, deep * 0.6, uDarken);

  // liquid reveal mask from the palm crown
  vec2 o = vec2(uOrigin.x * aspect, uOrigin.y);
  float edge = distance(p, o) + (fbm(p * 3.2 + t * 2.0) - 0.5) * 0.38;
  float R = uReveal * (aspect + 0.9);
  float m = 1.0 - smoothstep(R - 0.035, R + 0.015, edge);
  float rim = smoothstep(R - 0.14, R - 0.01, edge) * m;
  col = mix(col, glint * 0.95, rim * 0.55 * (1.0 - uDarken));

  gl_FragColor = vec4(col * m, m);
}`;

/** Full-screen shader rendered with plain three.js (no scene graph needed). */
export default function LiquidSyrup({ active, reduced, lowPower }: { active: boolean; reduced: boolean; lowPower: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 0.85 : 1.25);
    renderer.setPixelRatio(dpr);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    el.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uFlow: { value: 0 },
      uDarken: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uOrigin: { value: new THREE.Vector2(0.5, 0.69) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    const camera = new THREE.Camera();

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
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
      const k = within(storyProgress.get(), SCENES.karupatti);
      if (!reduced) uniforms.uTime.value += dt;
      uniforms.uReveal.value = Math.min(1, Math.max(0, (k - 0.08) / 0.32)) ** 1.4;
      uniforms.uFlow.value = k * 1.6;
      uniforms.uDarken.value = Math.min(1, Math.max(0, (k - 0.8) / 0.2));
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

  return <div ref={host} aria-hidden="true" className="absolute inset-0" />;
}
