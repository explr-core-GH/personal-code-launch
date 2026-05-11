import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ModelPreviewProps {
  scene: THREE.Object3D | null;
  className?: string;
}

export function ModelPreview({ scene, className }: ModelPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !scene) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0xf5f5f5, 1);
    container.appendChild(renderer.domElement);

    const previewScene = new THREE.Scene();
    previewScene.background = new THREE.Color(0xf5f5f5);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const directional = new THREE.DirectionalLight(0xffffff, 0.9);
    directional.position.set(5, 10, 7);
    previewScene.add(ambient, directional);

    const modelRoot = new THREE.Group();
    modelRoot.add(scene);
    previewScene.add(modelRoot);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    modelRoot.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, maxDim * 100);
    camera.position.set(maxDim * 1.4, maxDim * 1.2, maxDim * 1.6);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    let frameId = 0;
    const animate = () => {
      controls.update();
      renderer.render(previewScene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      modelRoot.remove(scene);
    };
  }, [scene]);

  return <div ref={containerRef} className={className} />;
}
