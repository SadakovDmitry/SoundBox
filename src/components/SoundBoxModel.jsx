import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function makeRoundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

function makeMutedIconTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 18;

  ctx.beginPath();
  ctx.moveTo(62, 104);
  ctx.lineTo(94, 104);
  ctx.lineTo(137, 66);
  ctx.lineTo(137, 190);
  ctx.lineTo(94, 152);
  ctx.lineTo(62, 152);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(163, 91);
  ctx.quadraticCurveTo(191, 128, 163, 165);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(55, 55);
  ctx.lineTo(201, 201);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRoundedPanel(width, height, radius, material) {
  const geometry = new THREE.ShapeGeometry(makeRoundedRectShape(width, height, radius));
  return new THREE.Mesh(geometry, material);
}

function FallbackCabin({ hidden }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        opacity: hidden ? 0 : 1,
        transition: 'opacity 260ms ease',
        pointerEvents: 'none',
        perspective: 900,
      }}
    >
      <div
        style={{
          width: 'min(70%, 330px)',
          aspectRatio: '0.78 / 1',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(3deg) rotateY(-18deg)',
          animation: 'soundbox-fallback-float 4s ease-in-out infinite',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34px',
            background: 'linear-gradient(145deg, #eef5ff 0%, #c7d4e5 48%, #8395a9 100%)',
            boxShadow: '0 34px 90px rgba(0,0,0,0.42), inset -18px 0 28px rgba(45,59,80,0.32), inset 0 0 0 1px rgba(255,255,255,0.75)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '13% 18% 16%',
            borderRadius: '28px',
            background: 'linear-gradient(180deg, #111827 0%, #060914 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '28%',
            right: '20%',
            top: '24%',
            height: '16%',
            borderRadius: 24,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: 38,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #7052ff 0%, #35bdf4 100%)',
            boxShadow: '0 16px 36px rgba(0,229,255,0.25)',
          }}
        >
          ￢
        </div>
        <div
          style={{
            position: 'absolute',
            right: '7%',
            top: '3%',
            width: 76,
            height: 90,
            clipPath: 'polygon(22% 0, 88% 0, 58% 38%, 92% 38%, 18% 100%, 42% 52%, 10% 52%)',
            background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
            filter: 'drop-shadow(0 16px 22px rgba(124,77,255,0.45))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '25%',
            right: '22%',
            bottom: '18%',
            height: 10,
            borderRadius: 999,
            background: '#00E676',
            boxShadow: '0 0 28px rgba(0,230,118,0.72)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '12%',
            right: '4%',
            bottom: '-8%',
            height: '15%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(124,77,255,0.26), transparent 68%)',
            transform: 'rotateX(75deg)',
          }}
        />
      </div>
      <style>
        {`
          @keyframes soundbox-fallback-float {
            0%, 100% { transform: rotateX(3deg) rotateY(-18deg) translateY(0); }
            50% { transform: rotateX(1deg) rotateY(-12deg) translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
}

export default function SoundBoxModel() {
  const mountRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.25, 8.4);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '2';
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.set(-0.04, -0.32, 0);
    group.position.y = 0.28;
    scene.add(group);

    const shellMaterial = new THREE.MeshStandardMaterial({
      color: '#e8eef7',
      metalness: 0.22,
      roughness: 0.38,
    });
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: '#070b14',
      metalness: 0.1,
      roughness: 0.62,
    });
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: '#9eacba',
      metalness: 0.34,
      roughness: 0.44,
    });
    const violetMaterial = new THREE.MeshStandardMaterial({
      color: '#6F52FF',
      emissive: '#25156a',
      emissiveIntensity: 0.42,
      metalness: 0.1,
      roughness: 0.36,
    });
    const cyanMaterial = new THREE.MeshStandardMaterial({
      color: '#4b9ac8',
      emissive: '#0a5d80',
      emissiveIntensity: 0.35,
      metalness: 0.12,
      roughness: 0.38,
    });
    const greenMaterial = new THREE.MeshStandardMaterial({
      color: '#00e676',
      emissive: '#00a856',
      emissiveIntensity: 1.3,
      roughness: 0.28,
    });

    const outerShape = makeRoundedRectShape(3.4, 4.4, 0.58);
    const innerHole = makeRoundedRectShape(2.28, 3.28, 0.42);
    outerShape.holes.push(innerHole);

    const shellGeometry = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.78,
      bevelEnabled: true,
      bevelSize: 0.08,
      bevelThickness: 0.08,
      bevelSegments: 8,
      curveSegments: 24,
    });
    shellGeometry.center();
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.castShadow = true;
    shell.receiveShadow = true;
    group.add(shell);

    const cabinBack = new THREE.Mesh(new THREE.BoxGeometry(2.18, 3.16, 0.5), innerMaterial);
    cabinBack.position.set(0, -0.02, -0.1);
    cabinBack.castShadow = true;
    cabinBack.receiveShadow = true;
    group.add(cabinBack);

    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.74, 0.86), sideMaterial);
    rightSide.position.set(1.62, -0.08, -0.04);
    rightSide.castShadow = true;
    rightSide.receiveShadow = true;
    group.add(rightSide);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.45, 0.18, 72), new THREE.MeshStandardMaterial({
      color: '#18223a',
      metalness: 0.18,
      roughness: 0.6,
    }));
    base.position.set(0, -2.34, -0.1);
    base.scale.z = 0.62;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0.8, 0.42);
    group.add(screenGroup);

    const screenLeft = createRoundedPanel(1.38, 0.66, 0.28, violetMaterial);
    screenLeft.position.x = -0.2;
    screenGroup.add(screenLeft);

    const screenRight = createRoundedPanel(1.14, 0.66, 0.28, cyanMaterial);
    screenRight.position.x = 0.32;
    screenRight.position.z = 0.01;
    screenGroup.add(screenRight);

    const iconTexture = makeMutedIconTexture();
    const icon = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.48),
      new THREE.MeshBasicMaterial({ map: iconTexture, transparent: true })
    );
    icon.position.set(0.08, 0, 0.04);
    screenGroup.add(icon);

    const statusLight = createRoundedPanel(1.14, 0.08, 0.04, greenMaterial);
    statusLight.position.set(0, -1.4, 0.43);
    group.add(statusLight);

    const logoBolt = new THREE.Group();
    const boltMaterial = new THREE.MeshStandardMaterial({
      color: '#8F5CFF',
      emissive: '#4012b8',
      emissiveIntensity: 0.7,
      roughness: 0.32,
    });
    const boltPoints = [
      new THREE.Vector2(-0.16, 0.34),
      new THREE.Vector2(0.28, 0.34),
      new THREE.Vector2(0.05, 0.02),
      new THREE.Vector2(0.3, 0.02),
      new THREE.Vector2(-0.2, -0.48),
      new THREE.Vector2(-0.02, -0.12),
      new THREE.Vector2(-0.28, -0.12),
    ];
    const boltShape = new THREE.Shape(boltPoints);
    const boltGeometry = new THREE.ExtrudeGeometry(boltShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 2,
    });
    const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
    bolt.position.set(1.32, 1.9, 0.42);
    bolt.rotation.z = -0.12;
    logoBolt.add(bolt);
    group.add(logoBolt);

    const ambientLight = new THREE.AmbientLight('#b8c7ff', 1.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 3.4);
    keyLight.position.set(3.5, 5.5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight('#00e5ff', 22, 7);
    rimLight.position.set(-2.8, 0.8, 2.4);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.35, 80),
      new THREE.MeshBasicMaterial({ color: '#6f52ff', transparent: true, opacity: 0.08 })
    );
    floor.position.set(0, -2.55, -0.9);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      const safeWidth = Math.max(width, 1);
      const safeHeight = Math.max(height, 1);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(safeWidth, safeHeight, false);
    };

    const handlePointerMove = (event) => {
      const rect = mount.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handlePointerLeave = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    mount.addEventListener('pointermove', handlePointerMove);
    mount.addEventListener('pointerleave', handlePointerLeave);

    let frameId = 0;
    const startedAt = performance.now();
    let readyReported = false;

    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      group.rotation.y += ((-0.3 + pointerRef.current.x * 0.34) - group.rotation.y) * 0.06;
      group.rotation.x += ((-0.04 - pointerRef.current.y * 0.15) - group.rotation.x) * 0.06;
      group.position.y = 0.28 + Math.sin(elapsed * 1.25) * 0.06;
      screenGroup.position.z = 0.42 + Math.sin(elapsed * 2.2) * 0.012;
      statusLight.scale.x = 0.92 + Math.sin(elapsed * 3.1) * 0.06;
      renderer.render(scene, camera);
      if (!readyReported) {
        readyReported = true;
        setWebglReady(true);
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      mount.removeEventListener('pointermove', handlePointerMove);
      mount.removeEventListener('pointerleave', handlePointerLeave);
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      });
      iconTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      aria-label="Интерактивная 3D-модель кабинки AcoustiQ"
      data-soundbox-model-ready={webglReady ? 'true' : 'fallback'}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 420,
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      <FallbackCabin hidden={webglReady} />
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 2 }} />
    </div>
  );
}
