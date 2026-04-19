export const state = {
  // Core skeleton
  nodes: [],
  bones: [],
  constraints: {},
  currentHierarchy: {},
  currentPelvisChildren: [],
  currentFootNodes: [],
  currentGroundY: 130,

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
    showShadow: false,
    showBoundingBox: false,
    onionSkin: false
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
    bodyType: 'adult-male'
  },

  // Playback
  playback: {
    isPlaying: false,
    fps: 12,
    loop: true,
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
  lockLimbLengths: false,

  // Hierarchy constants (for human body)
  PELVIS_CHILDREN: ['chest', 'bum', 'shoulder_l', 'shoulder_r', 'neck', 'head',
    'elbow_l', 'hand_l', 'elbow_r', 'hand_r',
    'hip_l', 'hip_r', 'knee_l', 'knee_r', 'foot_l', 'foot_r'],
  FOOT_NODES: ['foot_l', 'foot_r'],
  GROUND_Y: 130,

  // Node hierarchy mapping
  NODE_HIERARCHY: {
    'shoulder_l': ['elbow_l', 'hand_l'],
    'shoulder_r': ['elbow_r', 'hand_r'],
    'elbow_l': ['hand_l'],
    'elbow_r': ['hand_r'],
    'hip_l': ['knee_l', 'foot_l'],
    'hip_r': ['knee_r', 'foot_r'],
    'knee_l': ['foot_l'],
    'knee_r': ['foot_r'],
    'neck': ['head'],
    'chest': ['shoulder_l', 'shoulder_r', 'neck', 'head', 'elbow_l', 'hand_l', 'elbow_r', 'hand_r'],
    'bum': ['hip_l', 'hip_r', 'knee_l', 'knee_r', 'foot_l', 'foot_r'],
    'pelvis': ['chest', 'bum', 'shoulder_l', 'shoulder_r', 'neck', 'head', 'elbow_l', 'hand_l', 'elbow_r', 'hand_r', 'hip_l', 'hip_r', 'knee_l', 'knee_r', 'foot_l', 'foot_r']
  }
};

export function snapshot(nodes) {
  return JSON.parse(JSON.stringify(nodes));
}