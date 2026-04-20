export const state = {
  // Core skeleton
  nodes: [],
  bones: [],
  constraints: {},
  currentHierarchy: {},
  currentPelvisChildren: [],
  currentFootNodes: [],
  currentGroundY: 130,
  bodyImages: {},

  // Animation
  frames: [],
  currentFrame: 0,

  // Selection & drag
  selectedNodes: [],
  dragNode: null,
  isDragging: false,
  footAnchor: false,

  // Character colors
  charColors: {
    armL: '#0055aa',
    armR: '#005533',
    legL: '#0044cc',
    legR: '#006644',
    body: '#1a3344'
  },

  // Interaction mode
  interactionMode: 'move', // 'move' | 'pan'

  // View settings
  view: {
    panOffset: { x: 0, y: 0 },
    charScale: 1,
    showGrid: true,
    showLabels: true,
    showDistances: false,
    showShadow: false,
    showBoundingBox: false,
    onionSkin: false,
    spriteMode: false,
    showSprites: false
  },

  // Sprite box
  spriteBox: {
    x: 0,
    y: 150,
    width: 375,
    height: 375,
    scale: 1
  },

  // Metadata
  meta: {
    name: null,
    author: '',
    description: '',
    height: 180,
    category: 'human',
    bodyType: 'adult-male',
    direction: 'left'
  },

  // Playback
  playback: {
    isPlaying: false,
    fps: 12,
    loop: true,
    tweening: true,
    interval: null
  },

  // Temporary drag state
  dragState: {
    isDraggingBox: false,
    boxDragHandle: null,
    boxDragStart: null,
    panStart: null
  },

  // Settings
  useIK: false,
  lockLimbLengths: false,

  // Hierarchy constants (defaults)
  PELVIS_CHILDREN: [],
  FOOT_NODES: [],
  GROUND_Y: 130,

  // Dynamic node hierarchy mapping (derived from bones)
  NODE_HIERARCHY: {}
};

export function snapshot(nodes) {
  return JSON.parse(JSON.stringify(nodes));
}