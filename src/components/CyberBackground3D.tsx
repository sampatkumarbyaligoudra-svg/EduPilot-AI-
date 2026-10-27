import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Eye, EyeOff, Zap } from "lucide-react";

export const CyberBackground3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !isEnabled) return;

    const container = containerRef.current;
    let frameId = 0;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement("canvas").getContext("webgl2");
        if (!gl) return true;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Scene setup with spooky dark violet fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07040e, 0.0022);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 85;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Clean container and attach canvas
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // --- Object 1: Floating Will-o'-the-Wisps & Halloween Embers ---
    const nodeCount = isSoftwareGl ? 45 : 85;
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);
    const nodeVelocities: { x: number; y: number; z: number }[] = [];

    // Halloween palette: Pumpkin Orange, Witch Purple, Spectral Green
    const palette = [
      new THREE.Color(0xf97316), // Vivid Orange
      new THREE.Color(0xfb923c), // Light Amber Pumpkin
      new THREE.Color(0xa855f7), // Witch Purple
      new THREE.Color(0xc084fc), // Spectral Violet
      new THREE.Color(0x10b981), // Ghost Green
    ];

    for (let i = 0; i < nodeCount; i++) {
      const idx = i * 3;
      nodePositions[idx] = (Math.random() - 0.5) * 130;
      nodePositions[idx + 1] = (Math.random() - 0.5) * 90;
      nodePositions[idx + 2] = (Math.random() - 0.5) * 70;
      nodeVelocities.push({
        x: (Math.random() - 0.5) * 0.035,
        y: (Math.random() - 0.5) * 0.035 + 0.01, // slow upward drift like embers
        z: (Math.random() - 0.5) * 0.035,
      });

      const color = palette[Math.floor(Math.random() * palette.length)];
      nodeColors[idx] = color.r;
      nodeColors[idx + 1] = color.g;
      nodeColors[idx + 2] = color.b;
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    nodeGeometry.setAttribute("color", new THREE.BufferAttribute(nodeColors, 3));

    const nodeMaterial = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(nodes);

    // --- Object 2: Dynamic Spooky Spectral Line Connections ---
    const maxConnections = nodeCount * 4;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // --- Object 3: Central Celestial Harvest / Blood Moon Core ---
    const coreGroup = new THREE.Group();

    // Spooky sphere / icosahedron wireframe
    const icosahedronGeo = new THREE.IcosahedronGeometry(13, 2);
    const icosahedronMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const icosahedron = new THREE.Mesh(icosahedronGeo, icosahedronMat);
    coreGroup.add(icosahedron);

    // Mystic witch purple orbit rings
    const torusGeo = new THREE.TorusGeometry(19, 0.45, 8, 48);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 3;
    coreGroup.add(torus);

    const torus2Geo = new THREE.TorusGeometry(22, 0.3, 8, 48);
    const torus2Mat = new THREE.MeshBasicMaterial({
      color: 0xd946ef,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
    torus2.rotation.y = Math.PI / 4;
    coreGroup.add(torus2);

    coreGroup.position.set(0, 0, -10);
    scene.add(coreGroup);

    // Mouse Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onPointerMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 20;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 15;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Resize handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Animation Tick Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Exponential damping for mouse parallax
      currentMouseX += (targetMouseX - currentMouseX) * (1 - Math.exp(-4 * delta));
      currentMouseY += (targetMouseY - currentMouseY) * (1 - Math.exp(-4 * delta));
      camera.position.x = currentMouseX;
      camera.position.y = -currentMouseY;
      camera.lookAt(0, 0, 0);

      // Rotate Knowledge Core
      coreGroup.rotation.y += delta * 0.2;
      coreGroup.rotation.x += delta * 0.12;
      torus.rotation.z += delta * 0.25;
      torus2.rotation.z -= delta * 0.18;

      // Update Node positions and link connections
      const posAttr = nodeGeometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      let lineVertexIdx = 0;
      const lineArray = lineGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < nodeCount; i++) {
        const idx = i * 3;
        posArray[idx] += nodeVelocities[i].x;
        posArray[idx + 1] += nodeVelocities[i].y;
        posArray[idx + 2] += nodeVelocities[i].z;

        // Bounce back into bounds
        if (Math.abs(posArray[idx]) > 60) nodeVelocities[i].x *= -1;
        if (Math.abs(posArray[idx + 1]) > 40) nodeVelocities[i].y *= -1;
        if (Math.abs(posArray[idx + 2]) > 30) nodeVelocities[i].z *= -1;

        // Connect adjacent nodes that are close to each other
        for (let j = i + 1; j < nodeCount; j++) {
          const jdx = j * 3;
          const dx = posArray[idx] - posArray[jdx];
          const dy = posArray[idx + 1] - posArray[jdx + 1];
          const dz = posArray[idx + 2] - posArray[jdx + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < 260 && lineVertexIdx < maxConnections * 6 - 6) {
            lineArray[lineVertexIdx++] = posArray[idx];
            lineArray[lineVertexIdx++] = posArray[idx + 1];
            lineArray[lineVertexIdx++] = posArray[idx + 2];
            lineArray[lineVertexIdx++] = posArray[jdx];
            lineArray[lineVertexIdx++] = posArray[jdx + 1];
            lineArray[lineVertexIdx++] = posArray[jdx + 2];
          }
        }
      }

      posAttr.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineVertexIdx / 3);
      (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);

      // Resource cleanup
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      icosahedronGeo.dispose();
      icosahedronMat.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      torus2Geo.dispose();
      torus2Mat.dispose();
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
  }, [isEnabled]);

  return (
    <>
      {/* Three.js Fixed Background Viewport */}
      {isEnabled && (
        <div
          ref={containerRef}
          className="fixed inset-0 pointer-events-none -z-20 overflow-hidden opacity-80"
          aria-hidden="true"
        />
      )}

      {/* Tasteful Halloween Decorative Overlay Elements */}
      {isEnabled && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none" aria-hidden="true">
          {/* Subtle Corner Spiderweb Top-Left */}
          <svg
            className="absolute -top-2 -left-2 w-32 h-32 text-purple-500/20 opacity-40 hover:opacity-70 transition"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          >
            <path d="M0,0 L100,0 M0,0 L0,100 M0,0 L85,85 M0,0 L45,90 M0,0 L90,45" />
            <path d="M20,0 Q20,20 0,20 M40,0 Q40,40 0,40 M65,0 Q65,65 0,65 M90,0 Q90,90 0,90" />
          </svg>

          {/* Subtle Corner Spiderweb Top-Right */}
          <svg
            className="absolute -top-2 -right-2 w-32 h-32 text-orange-500/20 opacity-40 hover:opacity-70 transition scale-x-[-1]"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          >
            <path d="M0,0 L100,0 M0,0 L0,100 M0,0 L85,85 M0,0 L45,90 M0,0 L90,45" />
            <path d="M20,0 Q20,20 0,20 M40,0 Q40,40 0,40 M65,0 Q65,65 0,65 M90,0 Q90,90 0,90" />
          </svg>

          {/* Gliding Halloween Bat 1 */}
          <div className="absolute top-12 left-0 animate-bat-fly text-2xl text-purple-400/50 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
            🦇
          </div>

          {/* Gliding Halloween Bat 2 (Delayed) */}
          <div className="absolute top-28 left-0 animate-bat-fly-delayed text-lg text-orange-400/40 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">
            🦇
          </div>

          {/* Floating Friendly Ghost in Top-Right Ambience */}
          <div className="absolute top-20 right-8 sm:right-16 animate-float-ghost text-3xl opacity-35 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            👻
          </div>
        </div>
      )}

      {/* Floating 3D Background Toggle Button in Bottom Right */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className="px-3.5 py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 text-orange-300 hover:text-orange-200 border border-orange-500/40 backdrop-blur-md text-xs font-semibold flex items-center gap-2 shadow-lg shadow-orange-950/40 transition hover:scale-105"
          title={isEnabled ? "Disable Spooky 3D Background to save GPU/Battery" : "Enable Spooky 3D Animated Background"}
        >
          {isEnabled ? (
            <>
              <span className="text-sm">🎃</span>
              <span className="hidden sm:inline">Spooky FX: ON</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Spooky FX: OFF</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
