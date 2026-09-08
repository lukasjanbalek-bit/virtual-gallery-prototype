import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const statePath = fileURLToPath(new URL('../src/public-gallery-state.json', import.meta.url));
const state = JSON.parse(await readFile(statePath, 'utf8'));
const gallery = state.gallery;
const buildLayout = state.buildLayout;

if (!gallery || !buildLayout) {
  throw new Error('Gallery state is missing gallery or buildLayout.');
}

const supportUrl = 'https://donate.stripe.com/00weVf1NM1NR8KocH3eQM00';
const supportPainting = gallery.paintings.find((painting) => (
  painting.labelTitle === 'Podpora tvorby a projektů'
  || painting.imageSrc === 'art/banners/tipcore-orbital.gif'
));
const supportPedestal = gallery.pedestals.find((pedestal) => pedestal.roomAttachment?.roomId === 'room-3');
const supportRoom = buildLayout.rooms.find((room) => room.id === 'room-3');
const digitalRoom = buildLayout.rooms.find((room) => room.id === 'future-1');

if (!supportPainting || !supportPedestal || !supportRoom || !digitalRoom) {
  throw new Error('Expected support hall objects were not found.');
}

gallery.paintings = gallery.paintings.filter((painting) => (
  painting.wallAttachment?.roomId !== 'future-2'
  && painting.labelTitle !== 'Tvorba, vývoj a nové možnosti'
));

Object.assign(supportPainting, {
  imageSrc: 'art/banners/tipcore-orbital.gif',
  x: 0,
  y: 5.75,
  z: 45.135,
  ry: Math.PI,
  w: 3.2,
  h: 3.0337,
  aspect: 1.05485,
  wallNormal: [0, 0, -1],
  wallAttachment: {
    wallId: 'room-3:front',
    roomId: 'room-3',
    side: 'front',
    alongRatio: 0.5,
    heightRatio: 0.7667,
    offset: 0.115,
  },
  frameSize: 'hairline',
  frameColor: '#071315',
  labelTitle: 'TipCore',
  labelMedium: 'Podpora tvorby a projektů',
  labelSize: '',
  labelDate: '',
  labelPrice: '',
  labelVisible: false,
  actionUrl: 'gallery:support',
  actionType: 'link',
  actionTitle: 'Podpořit tvorbu',
  actionText: '',
  actionArea: 'whole',
});

Object.assign(supportPedestal, {
  x: 0,
  z: 34.25,
  ry: Math.PI,
  width: 1.5,
  depth: 1.2,
  height: 1.35,
  type: 'pillar',
  content: {
    type: 'support-console',
    scale: 0.82,
    actionLabel: 'Podpořit tvorbu',
    actionUrl: supportUrl,
    stickers: [],
    actionZones: [],
  },
  roomAttachment: {
    roomId: 'room-3',
    xRatio: 0.5,
    zRatio: 0.5,
  },
});

Object.assign(supportRoom, {
  centerZ: 34.25,
  width: 22,
  depth: 22,
  height: 7.5,
  supportReveal: true,
});
digitalRoom.roomName = 'DIGITÁLNÍ TVORBA';
Object.assign(digitalRoom, { entryTitle: 'Digitální tvorba', entrySubtitle: 'Vytvořeno v počítači', entryTitleEnabled: true, entryTitlePlacement: 'center' });
Object.assign(buildLayout.rooms.find((room) => room.id === 'main'), { entryTitle: 'Vítejte', entryTitleEnabled: true, entryTitlePlacement: 'ahead' });
Object.assign(buildLayout.rooms.find((room) => room.id === 'room-2'), { entryTitle: 'Tradiční tvorba', entryTitleEnabled: true, entryTitlePlacement: 'center' });
const donorBoard = gallery.textPanels.find((panel) => panel.kind === 'donors');
if (donorBoard) {
  Object.assign(donorBoard, {
    x: 0, y: 2.2, z: 45.134, ry: Math.PI, width: 12.5, height: 3.3,
    bgColor: '#0c181b', textColor: '#ebf5f2',
    wallNormal: [0, 0, -1],
    wallAttachment: {
      wallId: 'room-3:front', roomId: 'room-3', side: 'front',
      alongRatio: 0.5, heightRatio: 2.2 / 7.5, offset: 0.116,
    },
  });
}

buildLayout.rooms = buildLayout.rooms.filter((room) => room.id !== 'future-2');
buildLayout.openings = buildLayout.openings.filter((opening) => (
  opening.fromRoomId !== 'future-2'
  && opening.toRoomId !== 'future-2'
));

state.lighting.ceilingLights = state.lighting.ceilingLights
  .filter((light) => light.roomIndex !== 4)
  .map((light) => ({ ...light }));

const supportDisplayLights = state.lighting.ceilingLights.filter((light) => (
  light.roomIndex === 2 && light.kind === 'display'
));

supportDisplayLights.forEach((light) => {
  light.showBeam = true;
  light.beamLength = 11.5;
  light.power = Math.max(Number(light.power) || 0, 88);
  light.angle = 20;
});

if (supportDisplayLights.length < 3) {
  [
    { trackPosition: 0.18, yaw: 34, pitch: -53 },
    { trackPosition: 0.56, yaw: -25, pitch: -55 },
  ].slice(0, 3 - supportDisplayLights.length).forEach((config) => {
    state.lighting.ceilingLights.push({
      kind: 'display',
      trackId: 'loop-mid',
      trackPosition: config.trackPosition,
      yaw: config.yaw,
      pitch: config.pitch,
      power: 88,
      color: '#dffcff',
      angle: 20,
      roomIndex: 2,
      showBeam: true,
      beamLength: 11.5,
    });
  });
}

state.exportedAt = new Date().toISOString();
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  paintings: gallery.paintings.length,
  rooms: buildLayout.rooms.map(({ id, roomName, width, depth, height }) => ({ id, roomName, width, depth, height })),
  openings: buildLayout.openings.map(({ id }) => id),
  supportLights: state.lighting.ceilingLights.filter((light) => light.roomIndex === 2 && light.kind === 'display').length,
}, null, 2));
