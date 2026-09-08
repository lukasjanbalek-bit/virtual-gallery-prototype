import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uMap;
  uniform vec3 uTint;
  uniform float uOpacity;
  uniform float uDissolve;
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
               mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x), f.y);
  }
  void main() {
    vec2 uv = vUv;
    float cloud = noise(uv * vec2(14.0, 6.0) + vec2(uTime * 0.12, -uTime * 0.16));
    uv.x += sin(uv.y * 19.0 + uTime) * 0.007 * uDissolve;
    uv.y -= cloud * 0.045 * uDissolve;
    vec4 ink = texture2D(uMap, uv);
    float remaining = 1.0 - smoothstep(cloud - 0.18, cloud + 0.3, uDissolve);
    gl_FragColor = vec4(ink.rgb * uTint, ink.a * uOpacity * remaining);
    #include <colorspace_fragment>
  }
`;

function makeTextCanvas(text, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const words = text.split(/\s+/);
  const lines = [''];
  ctx.font = '600 122px Georgia, serif';
  for (const word of words) {
    const candidate = `${lines.at(-1)} ${word}`.trim();
    if (ctx.measureText(candidate).width > 1360 && lines.at(-1) && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = candidate;
  }
  let fontSize = 122;
  while (fontSize > 28 && lines.some((line) => ctx.measureText(line).width > 1360)) {
    fontSize -= 2;
    ctx.font = `600 ${fontSize}px Georgia, serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const face = ctx.createLinearGradient(0, 120, 0, 380);
  face.addColorStop(0, '#ffffff');
  face.addColorStop(0.48, '#edf8f7');
  face.addColorStop(1, '#84b6b6');
  ctx.fillStyle = face;
  ctx.strokeStyle = 'rgba(224, 255, 255, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#92d3d0';
  ctx.shadowBlur = 9;
  const centerY = subtitle ? 220 : 256;
  lines.forEach((line, index) => {
    const y = centerY + (index - (lines.length - 1) / 2) * fontSize * 1.1;
    ctx.strokeText(line, 768, y);
    ctx.fillText(line, 768, y);
  });
  if (subtitle) {
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#b7d5d2';
    ctx.font = '400 42px Georgia, serif';
    ctx.fillText(subtitle, 768, 388, 1300);
  }
  return canvas;
}

export function createRoomEntryText(scene, camera, { reducedMotion = false, announce = () => {} } = {}) {
  const root = new THREE.Group();
  root.name = 'room-entry-text';
  root.visible = false;
  scene.add(root);
  const cameraPosition = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const basePosition = new THREE.Vector3();
  const lastShown = new Map();
  let currentRoomId = null;
  let activeRoomId = null;
  let elapsed = 0;
  let age = 0;
  let title = '';
  let forcedPreview = false;

  function clear() {
    const textures = new Set();
    root.children.forEach((mesh) => {
      textures.add(mesh.material.uniforms.uMap.value);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    textures.forEach((texture) => texture.dispose());
    root.clear();
    root.visible = false;
  }

  function show(room, preview = false) {
    const text = String(room?.entryTitle || '').trim().slice(0, 80);
    if (!text || (!preview && room.entryTitleEnabled === false)) return;
    clear();
    title = text;
    activeRoomId = room.id;
    forcedPreview = preview;
    age = 0;
    lastShown.set(room.id, elapsed);
    const texture = new THREE.CanvasTexture(makeTextCanvas(text, String(room.entrySubtitle || '').slice(0, 100)));
    texture.colorSpace = THREE.SRGBColorSpace;
    const width = room.entryTitlePlacement === 'ahead' ? 2.65 : Math.min(4.2, room.width * 0.64);
    for (let layer = 3; layer >= 0; layer -= 1) {
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uMap: { value: texture },
          uTint: { value: new THREE.Color(layer ? '#537e80' : '#ffffff') },
          uOpacity: { value: 0 },
          uDissolve: { value: 0 },
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 3), material);
      mesh.position.set(-layer * 0.008, -layer * 0.009, -layer * 0.015);
      mesh.renderOrder = 20 + 3 - layer;
      root.add(mesh);
    }
    camera.getWorldPosition(cameraPosition);
    basePosition.set(room.centerX, Math.min(room.height - 0.6, 2.05), room.centerZ);
    if (room.entryTitlePlacement === 'ahead') {
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      basePosition.copy(cameraPosition).addScaledVector(forward, 2.8);
      basePosition.x = THREE.MathUtils.clamp(basePosition.x, room.centerX - room.width / 2 + 1, room.centerX + room.width / 2 - 1);
      basePosition.z = THREE.MathUtils.clamp(basePosition.z, room.centerZ - room.depth / 2 + 1, room.centerZ + room.depth / 2 - 1);
    }
    root.position.copy(basePosition);
    root.visible = true;
    announce([text, room.entrySubtitle].filter(Boolean).join('. '));
  }

  function update(delta, rooms, playerPosition) {
    elapsed += delta;
    const room = rooms.find((item) => (
      Math.abs(playerPosition.x - item.centerX) < item.width / 2 - 0.25
      && Math.abs(playerPosition.z - item.centerZ) < item.depth / 2 - 0.25
    ));
    const roomId = room?.id ?? null;
    if (currentRoomId !== roomId) {
      currentRoomId = roomId;
      if (room && elapsed - (lastShown.get(room.id) ?? -Infinity) > 20) show(room);
    }
    if (!root.visible) return;
    age += delta;
    if (!forcedPreview && roomId !== activeRoomId) age = Math.max(age, 5.5);
    const opacity = THREE.MathUtils.smoothstep(age, 0.35, 1.8)
      * (1 - THREE.MathUtils.smoothstep(age, 4.2, 7.8));
    const dissolve = reducedMotion ? 0 : THREE.MathUtils.smoothstep(age, 4.4, 7.8);
    camera.getWorldPosition(cameraPosition);
    root.position.copy(basePosition);
    if (!reducedMotion) root.position.y += Math.sin(age * 0.7) * 0.025 + dissolve * 0.16;
    root.lookAt(cameraPosition);
    // Keep a close visitor from walking through a full-screen transparent label.
    const proximity = THREE.MathUtils.smoothstep(root.position.distanceTo(cameraPosition), 0.6, 1.5);
    root.children.forEach((mesh, index) => {
      mesh.material.uniforms.uOpacity.value = opacity * proximity * (index === 3 ? 0.93 : 0.32);
      mesh.material.uniforms.uDissolve.value = dissolve;
      mesh.material.uniforms.uTime.value = reducedMotion ? 0 : age;
    });
    if (age >= 7.8) clear();
  }

  return {
    update,
    preview: (room) => show(room, true),
    debug: () => ({
      text: title,
      roomId: activeRoomId,
      visible: root.visible,
      age: Number(age.toFixed(2)),
      opacity: root.children.at(-1)?.material.uniforms.uOpacity.value ?? 0,
      position: root.position.toArray(),
      quaternion: root.quaternion.toArray(),
    }),
  };
}
