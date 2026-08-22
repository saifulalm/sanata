"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";

/**
 * Pratinjau 3D "exploded floor view".
 *
 * Lantai digambar sebagai pelat bertumpuk yang bisa direnggangkan lewat satu
 * penggeser. Cara membaca bangunan seperti ini lazim dipakai arsitek untuk
 * menunjukkan isi tiap lapis tanpa memotong gambar — di sini dibuat interaktif
 * supaya pengunjung bisa memilih lantai dan membaca keterangannya.
 *
 * Beberapa keputusan yang dijaga:
 *
 * - Ukuran datang dari CMS dalam meter sungguhan, lalu diskalakan sekali agar
 *   bangunan setinggi apa pun tetap pas di bingkai. Skala dihitung dari data,
 *   bukan angka tetap, sehingga rumah satu lantai dan menara 20 lantai
 *   sama-sama terbaca.
 * - Model tetap tergambar walau animasi tidak pernah jalan: satu frame statis
 *   selalu dirender, dan `prefers-reduced-motion` hanya mematikan putaran
 *   otomatis — penggeser dan pemilihan lantai tetap berfungsi.
 * - Tanpa WebGL komponen berhenti diam-diam dan menyerahkan tampilan ke
 *   diagram cadangan non-3D, bukan melempar error.
 * - Kanvas `aria-hidden`; navigasi sebenarnya memakai daftar tombol lantai di
 *   sebelahnya, sehingga pengguna keyboard dan pembaca layar tetap terlayani.
 */

export interface ExplodedFloor {
  id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  href: string | null;
  accent: string;
  heightM: number;
  widthM: number;
  depthM: number;
  /** Dimensi waktu: minggu ke berapa lantai ini mulai dikerjakan. */
  startWeek: number;
  durationWeeks: number;
}

/** Token warna dari CMS dipetakan ke warna hex yang dipakai material. */
export const FLOOR_ACCENT_HEX: Record<string, string> = {
  cyan: "#22d3ee",
  indigo: "#818cf8",
  amber: "#fbbf24",
  emerald: "#34d399",
};

export function floorAccentHex(token: string | null | undefined): string {
  return (token && FLOOR_ACCENT_HEX[token]) || FLOOR_ACCENT_HEX.cyan;
}

/** Tinggi total dunia 3D; semua ukuran meter dipetakan ke dalam rentang ini. */
const WORLD_HEIGHT = 5.2;
const MAX_GAP = 1.1;

/**
 * Dukungan WebGL diperiksa sekali lalu di-cache.
 *
 * Hasilnya dibaca lewat `useSyncExternalStore` supaya nilainya stabil dan
 * markup server tetap cocok: server menganggap didukung, lalu klien menukar ke
 * diagram cadangan setelah hidrasi bila ternyata tidak.
 */
let webglProbe: boolean | null = null;

function probeWebGL(): boolean {
  if (webglProbe !== null) return webglProbe;
  try {
    const canvas = document.createElement("canvas");
    webglProbe = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}

const NO_OP_SUBSCRIBE = () => () => {};

function useWebGLSupported(): boolean {
  return useSyncExternalStore(NO_OP_SUBSCRIBE, probeWebGL, () => true);
}

export function ExplodedBuildingView({
  floors,
  explode,
  autoRotate,
  selectedId,
  onSelect,
  progressByFloor,
  className,
}: {
  floors: ExplodedFloor[];
  /** 0–1. 0 berarti lantai rapat seperti bangunan utuh. */
  explode: number;
  autoRotate: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /**
   * Mode 4D: kemajuan tiap lantai 0–1 pada titik waktu yang sedang dilihat.
   * Kosongkan (atau `null`) untuk menampilkan bangunan jadi seutuhnya.
   */
  progressByFloor?: Record<string, number> | null;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const supported = useWebGLSupported();

  // Nilai yang berubah tiap frame disimpan di ref agar tidak membangun ulang
  // seluruh scene setiap penggeser digeser. Penulisannya dilakukan di efek,
  // bukan saat render — menulis ref saat render bisa membuat komponen tidak
  // ikut memperbarui diri seperti yang diharapkan.
  const explodeRef = useRef(explode);
  const rotateRef = useRef(autoRotate);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const progressRef = useRef(progressByFloor);

  useEffect(() => {
    explodeRef.current = explode;
    rotateRef.current = autoRotate;
    selectedRef.current = selectedId;
    onSelectRef.current = onSelect;
    progressRef.current = progressByFloor;
  }, [explode, autoRotate, selectedId, onSelect, progressByFloor]);

  // Perubahan susunan lantai harus membangun ulang geometri; perubahan angka
  // penggeser tidak. Kunci ini hanya memuat hal yang mengubah bentuk.
  const shapeKey = floors.map((f) => `${f.id}:${f.heightM}:${f.widthM}:${f.depthM}:${f.accent}`).join("|");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || floors.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Konteks bisa saja tetap gagal walau probe lolos (mis. konteks WebGL
    // sudah habis di tab yang sama), jadi komponen berhenti diam-diam dan
    // menyisakan latar gradien, bukan melempar error.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const width = () => Math.max(mount.clientWidth, 1);
    const height = () => Math.max(mount.clientHeight, 1);

    const camera = new THREE.PerspectiveCamera(38, width() / height(), 0.1, 100);
    camera.position.set(7.4, 5.4, 8.2);
    camera.lookAt(0, 0, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width(), height());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight("#e2e8f0", 1.1));
    const keyLight = new THREE.DirectionalLight("#ffffff", 1.6);
    keyLight.position.set(6, 10, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight("#67e8f9", 0.7);
    rimLight.position.set(-7, 4, -6);
    scene.add(rimLight);

    const root = new THREE.Group();
    scene.add(root);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(resource: T) => {
      disposables.push(resource);
      return resource;
    };

    // --- Skala: peta dari meter ke satuan dunia -------------------------------
    const totalHeightM = floors.reduce((sum, f) => sum + f.heightM, 0);
    const maxFootprintM = Math.max(...floors.map((f) => Math.max(f.widthM, f.depthM)));
    // Dua batas dipakai sekaligus supaya bangunan yang sangat lebar tidak
    // keluar bingkai walau tingginya pendek, dan sebaliknya.
    const scale = Math.min(WORLD_HEIGHT / Math.max(totalHeightM, 0.001), 6.4 / Math.max(maxFootprintM, 0.001));

    interface FloorMesh {
      id: string;
      group: THREE.Group;
      slab: THREE.Mesh;
      material: THREE.MeshStandardMaterial;
      baseAccent: THREE.Color;
      /** Posisi Y saat bangunan rapat. */
      restY: number;
      index: number;
      /** Tinggi pelat di satuan dunia — dipakai mode 4D saat lantai tumbuh. */
      worldHeight: number;
    }

    const floorMeshes: FloorMesh[] = [];
    let cursorM = 0;

    floors.forEach((floor, index) => {
      const h = floor.heightM * scale;
      const w = floor.widthM * scale;
      const d = floor.depthM * scale;

      const group = new THREE.Group();
      const accent = new THREE.Color(floorAccentHex(floor.accent));

      const material = track(
        new THREE.MeshStandardMaterial({
          color: accent,
          metalness: 0.25,
          roughness: 0.42,
          transparent: true,
          opacity: 0.92,
        })
      );
      const slab = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), material);
      group.add(slab);

      // Garis tepi membuat tiap pelat tetap terbaca sebagai lantai terpisah
      // walau warnanya berdekatan.
      const edges = new THREE.LineSegments(
        track(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d))),
        track(new THREE.LineBasicMaterial({ color: "#0f172a", transparent: true, opacity: 0.55 }))
      );
      group.add(edges);

      // Pelat tipis di dasar tiap lantai — membaca sebagai pelat beton dan
      // memberi kedalaman saat lantai direnggangkan.
      const deck = new THREE.Mesh(
        track(new THREE.BoxGeometry(w * 1.04, h * 0.06, d * 1.04)),
        track(new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.1, roughness: 0.8 }))
      );
      deck.position.y = -h / 2;
      group.add(deck);

      const restY = (cursorM + floor.heightM / 2) * scale - WORLD_HEIGHT / 2;
      group.position.y = restY;
      root.add(group);

      floorMeshes.push({ id: floor.id, group, slab, material, baseAccent: accent, restY, index, worldHeight: h });
      cursorM += floor.heightM;
    });

    // Bidang tanah sebagai acuan visual saat lantai melayang.
    const ground = new THREE.Mesh(
      track(new THREE.CircleGeometry(5.6, 64)),
      track(new THREE.MeshStandardMaterial({ color: "#0b1220", metalness: 0.4, roughness: 0.9 }))
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -WORLD_HEIGHT / 2 - 0.35;
    root.add(ground);

    // --- Interaksi ------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredId: string | null = null;

    const pickAt = (event: PointerEvent): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(floorMeshes.map((f) => f.slab), false);
      if (hits.length === 0) return null;
      return floorMeshes.find((f) => f.slab === hits[0].object)?.id ?? null;
    };

    const handleMove = (event: PointerEvent) => {
      hoveredId = pickAt(event);
      renderer.domElement.style.cursor = hoveredId ? "pointer" : "default";
    };
    const handleLeave = () => {
      hoveredId = null;
      renderer.domElement.style.cursor = "default";
    };
    const handleClick = (event: PointerEvent) => {
      const id = pickAt(event);
      if (id) onSelectRef.current(id);
    };

    renderer.domElement.addEventListener("pointermove", handleMove);
    renderer.domElement.addEventListener("pointerleave", handleLeave);
    renderer.domElement.addEventListener("pointerdown", handleClick);

    // --- Render loop ----------------------------------------------------------
    const clock = new THREE.Clock();
    let spin = 0.55;

    const draw = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (rotateRef.current && !reduceMotion) spin += delta * 0.32;
      root.rotation.y = spin;

      const gap = explodeRef.current * MAX_GAP;
      const progress = progressRef.current;

      for (const floor of floorMeshes) {
        const target = floor.restY + gap * floor.index;
        // Interpolasi ringan supaya perubahan penggeser terasa mengalir, bukan
        // meloncat — dan tetap sampai ke posisi akhir saat animasi mati.
        floor.group.position.y += (target - floor.group.position.y) * Math.min(1, delta * 8 || 1);

        const isSelected = selectedRef.current === floor.id;
        const isHovered = hoveredId === floor.id;
        const emphasis = isSelected ? 0.5 : isHovered ? 0.28 : 0;

        floor.material.emissive.copy(floor.baseAccent);
        floor.material.emissiveIntensity = emphasis;

        if (progress) {
          // Mode 4D: lantai tumbuh dari pelat dasarnya ke atas, jadi bangunan
          // benar-benar terlihat naik seiring waktu — bukan sekadar berubah
          // warna. Skala Y dipakai, bukan geometri baru, supaya menggeser garis
          // waktu tidak membangun ulang apa pun.
          const done = Math.max(0, Math.min(1, progress[floor.id] ?? 0));
          const shown = Math.max(done, 0.0001);
          floor.group.scale.y = shown;
          // Menskalakan dari pusat akan membuat pelat menyusut ke tengah; ini
          // menggesernya turun supaya dasarnya tetap menempel.
          floor.group.position.y -= (floor.worldHeight * (1 - shown)) / 2;
          floor.group.visible = done > 0;
          // Pekerjaan yang belum tuntas ditandai lebih tembus pandang.
          floor.material.opacity = done >= 1 ? 0.92 : 0.55;
          floor.material.emissiveIntensity = done > 0 && done < 1 ? 0.45 : emphasis;
        } else {
          floor.group.scale.y = 1;
          floor.group.visible = true;
          floor.material.opacity = selectedRef.current && !isSelected ? 0.45 : 0.92;
        }

        const lift = isSelected ? Math.sin(elapsed * 2) * 0.02 : 0;
        floor.group.position.x = lift;
      }

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
      if (running) return;
      running = true;
      clock.getDelta(); // buang jeda saat animasi dihentikan
      frameId = window.requestAnimationFrame(loop);
    };

    const resize = () => {
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(), height());
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

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
      renderer.domElement.removeEventListener("pointermove", handleMove);
      renderer.domElement.removeEventListener("pointerleave", handleLeave);
      renderer.domElement.removeEventListener("pointerdown", handleClick);
      disposables.forEach((resource) => resource.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    };
  }, [shapeKey, floors]);

  if (!supported) return <FallbackDiagram floors={floors} selectedId={selectedId} className={className} />;

  return (
    <div
      aria-hidden="true"
      className={className ?? "relative h-full w-full"}
    >
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}

/**
 * Diagram cadangan tanpa WebGL.
 *
 * Bukan sekadar pesan error: tumpukan lantai tetap tergambar dengan proporsi
 * lebar yang sama, sehingga informasi utamanya — susunan dan ukuran relatif
 * antar lantai — tetap sampai.
 */
function FallbackDiagram({
  floors,
  selectedId,
  className,
}: {
  floors: ExplodedFloor[];
  selectedId: string | null;
  className?: string;
}) {
  const maxWidth = Math.max(...floors.map((f) => f.widthM), 1);

  return (
    <div className={`${className ?? "relative h-full w-full"} flex flex-col-reverse items-center justify-center gap-1.5 p-6`}>
      {floors.map((floor) => (
        <div
          key={floor.id}
          title={floor.title}
          style={{
            width: `${(floor.widthM / maxWidth) * 100}%`,
            height: `${Math.max(floor.heightM * 5, 14)}px`,
            background: floorAccentHex(floor.accent),
            opacity: selectedId && selectedId !== floor.id ? 0.4 : 0.9,
          }}
          className="rounded-sm border border-slate-900/40"
        />
      ))}
      <p className="mt-3 text-center text-[11px] text-slate-400">
        Peramban ini tidak mendukung WebGL — ditampilkan sebagai diagram tumpukan lantai.
      </p>
    </div>
  );
}
