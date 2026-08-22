"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Model struktur 3D untuk latar hero dan bagian "Interactive Blueprint".
 *
 * Beberapa hal yang dijaga di sini karena komponen ini dipasang lebih dari
 * satu kali pada satu halaman:
 * - render loop berhenti saat elemen keluar viewport atau tab disembunyikan,
 * - semua geometry/material dilepas saat unmount supaya tidak bocor,
 * - kalau WebGL tidak tersedia, komponen berhenti diam-diam dan menyisakan
 *   lapisan gradien statis di belakangnya, bukan melempar error;
 * - `prefers-reduced-motion` menghentikan animasi, model tetap tergambar satu
 *   frame.
 */
export function BuildingSceneCanvas({ accent = "#67e8f9" }: { accent?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // lapisan gradien di belakang mount tetap tampil sebagai fallback
    }

    const scene = new THREE.Scene();
    const width = () => Math.max(mount.clientWidth, 1);
    const height = () => Math.max(mount.clientHeight, 1);

    const camera = new THREE.PerspectiveCamera(42, width() / height(), 0.1, 100);
    camera.position.set(0, 2.5, 8);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width(), height());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const accentColor = new THREE.Color(accent);
    scene.fog = new THREE.FogExp2("#020817", 0.08);

    const ambient = new THREE.AmbientLight("#dbeafe", 0.8);
    const keyLight = new THREE.PointLight(accentColor, 10, 25, 2);
    keyLight.position.set(3, 6, 4);
    const fillLight = new THREE.PointLight("#f59e0b", 4, 20, 2);
    fillLight.position.set(-4, 3, 2);
    scene.add(ambient, keyLight, fillLight);

    const root = new THREE.Group();
    scene.add(root);

    // Dicatat supaya bisa di-dispose satu per satu saat unmount.
    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(resource: T) => {
      disposables.push(resource);
      return resource;
    };

    const platformGeometry = track(new THREE.CylinderGeometry(3.6, 4.2, 0.35, 48));
    const platformMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: "#0f172a",
        metalness: 0.9,
        roughness: 0.25,
        clearcoat: 0.6,
        emissive: accentColor,
        emissiveIntensity: 0.06,
      })
    );
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -1.35;
    root.add(platform);

    const towerMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: "#cbd5e1",
        metalness: 0.95,
        roughness: 0.18,
        transmission: 0.08,
        clearcoat: 1,
        reflectivity: 0.8,
        emissive: accentColor,
        emissiveIntensity: 0.08,
      })
    );

    const towerGroup = new THREE.Group();
    const towerHeights = [2.2, 3.1, 4.4, 5.2, 3.7];
    towerHeights.forEach((towerHeight, index) => {
      const geometry = track(new THREE.BoxGeometry(0.9, towerHeight, 0.9));
      const tower = new THREE.Mesh(geometry, towerMaterial);
      const angle = (index / towerHeights.length) * Math.PI * 2;
      const radius = index === 2 ? 0 : 1.75;
      tower.position.set(Math.cos(angle) * radius, towerHeight / 2 - 1.1, Math.sin(angle) * radius);
      tower.rotation.y = angle * 0.3;
      towerGroup.add(tower);
    });
    root.add(towerGroup);

    const bridge = new THREE.Mesh(
      track(new THREE.BoxGeometry(2.8, 0.12, 0.3)),
      track(new THREE.MeshStandardMaterial({ color: "#7dd3fc", metalness: 0.85, roughness: 0.22 }))
    );
    bridge.position.set(0, 0.9, 0);
    bridge.rotation.z = 0.18;
    root.add(bridge);

    const droneGeometry = track(new THREE.TorusGeometry(0.18, 0.05, 12, 28));
    const droneMaterial = track(
      new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        emissive: accentColor,
        emissiveIntensity: 0.4,
        metalness: 0.7,
        roughness: 0.2,
      })
    );
    const drones = [new THREE.Mesh(droneGeometry, droneMaterial), new THREE.Mesh(droneGeometry, droneMaterial)];
    drones[0].position.set(2.3, 1.5, 0.5);
    drones[1].position.set(-2.1, 2.6, -0.6);
    drones.forEach((drone) => root.add(drone));

    const lineMaterial = track(new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.4 }));
    const linePoints = [new THREE.Vector3(-2.3, -0.9, -2), new THREE.Vector3(0, 2.9, 0), new THREE.Vector3(2.3, -0.9, 2)];
    const lineGeometry = track(new THREE.BufferGeometry().setFromPoints(linePoints));
    root.add(new THREE.Line(lineGeometry, lineMaterial));

    const clock = new THREE.Clock();

    const resize = () => {
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(), height());
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const draw = () => {
      const elapsed = clock.getElapsedTime();
      root.rotation.y = elapsed * 0.28;
      towerGroup.position.y = Math.sin(elapsed * 1.4) * 0.08;
      drones[0].position.y = 1.5 + Math.sin(elapsed * 2.1) * 0.24;
      drones[0].position.x = 2.1 + Math.cos(elapsed * 1.3) * 0.25;
      drones[1].position.y = 2.6 + Math.cos(elapsed * 1.7) * 0.18;
      drones[1].position.z = -0.6 + Math.sin(elapsed * 1.1) * 0.32;
      renderer.render(scene, camera);
    };

    // Satu frame statis selalu digambar supaya modelnya tetap terlihat walau
    // animasinya tidak pernah berjalan.
    draw();

    let frameId = 0;
    let running = false;
    const stop = () => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(frameId);
    };
    const loop = () => {
      draw();
      frameId = window.requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      clock.getDelta(); // buang jeda saat animasi dihentikan
      frameId = window.requestAnimationFrame(loop);
    };

    let visibleInViewport = false;
    const sync = () => {
      if (visibleInViewport && !document.hidden) start();
      else stop();
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleInViewport = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(mount);
    document.addEventListener("visibilitychange", sync);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      disposables.forEach((resource) => resource.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    };
  }, [accent]);

  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full bg-[radial-gradient(circle_at_center,_rgba(103,232,249,0.16),_transparent_62%)]"
    >
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}
