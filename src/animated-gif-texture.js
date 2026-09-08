import * as THREE from 'three';
import { parseGIF, decompressFrame } from 'gifuct-js';

const players = new Set();

export function createAnimatedGifTexture(url) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const patchCanvas = document.createElement('canvas');
  const patchContext = patchCanvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const controller = new AbortController();
  const player = { texture, frameCount: 0, frameIndex: -1, elapsed: 0, delay: 0, draw: null, disposed: false };
  players.add(player);
  texture.addEventListener('dispose', () => {
    player.disposed = true;
    player.draw = null;
    controller.abort();
    players.delete(player);
  });

  fetch(url, { signal: controller.signal }).then((response) => {
    if (!response.ok) throw new Error(`GIF HTTP ${response.status}`);
    return response.arrayBuffer();
  }).then((buffer) => {
    if (player.disposed) return;
    const gif = parseGIF(buffer);
    const frames = gif.frames.filter((frame) => frame.image);
    if (!frames.length) throw new Error('GIF has no image frames.');
    canvas.width = gif.lsd.width;
    canvas.height = gif.lsd.height;
    player.frameCount = frames.length;
    let previousFrame = null;
    let restoredPixels = null;

    player.draw = () => {
      // Composite patches in order: transparent pixels preserve the previous frame.
      if (previousFrame?.disposalType === 2) {
        const { left, top, width, height } = previousFrame.dims;
        context.clearRect(left, top, width, height);
      } else if (previousFrame?.disposalType === 3 && restoredPixels) {
        context.putImageData(restoredPixels, 0, 0);
      }
      player.frameIndex = (player.frameIndex + 1) % frames.length;
      if (player.frameIndex === 0) context.clearRect(0, 0, canvas.width, canvas.height);
      const frame = decompressFrame(frames[player.frameIndex], gif.gct, true);
      restoredPixels = frame.disposalType === 3 ? context.getImageData(0, 0, canvas.width, canvas.height) : null;
      patchCanvas.width = frame.dims.width;
      patchCanvas.height = frame.dims.height;
      patchContext.putImageData(new ImageData(frame.patch, frame.dims.width, frame.dims.height), 0, 0);
      context.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
      previousFrame = frame;
      player.delay = Math.max(20, frame.delay || 100) / 1000;
      texture.needsUpdate = true;
    };
    player.draw();
  }).catch((error) => {
    if (error.name !== 'AbortError') console.warn('Animated artwork could not be loaded.', error);
  });
  return texture;
}

export function updateAnimatedGifTextures(delta, { reducedMotion = false } = {}) {
  if (document.hidden || reducedMotion) return;
  players.forEach((player) => {
    if (!player.draw || player.frameCount < 2) return;
    player.elapsed += delta;
    if (player.elapsed >= player.delay) {
      player.elapsed = Math.min(player.elapsed - player.delay, 0.1);
      player.draw();
    }
  });
}

export function getAnimatedGifDebug() {
  return [...players].map(({ frameCount, frameIndex, texture }) => ({ frameCount, frameIndex, version: texture.version }));
}
