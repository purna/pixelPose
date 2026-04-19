// skeleton.js - Skeleton definitions and constraints
let currentNodes = [
  { id: 'head',      label: 'Head',       x:   0, y: -170 },
  { id: 'neck',      label: 'Neck',       x:   0, y: -145 },
  { id: 'shoulder_l',label: 'Shldr L',   x: -40, y: -110 },
  { id: 'shoulder_r',label: 'Shldr R',   x:  40, y: -110 },
  { id: 'chest',     label: 'Chest',      x:   0, y: -110 },
  { id: 'elbow_l',   label: 'Elbow L',    x: -65, y:  -65 },
  { id: 'elbow_r',   label: 'Elbow R',    x:  65, y:  -65 },
  { id: 'hand_l',    label: 'Hand L',     x: -80, y:  -20 },
  { id: 'hand_r',    label: 'Hand R',     x:  80, y:  -20 },
  { id: 'pelvis',    label: 'Pelvis',     x:   0, y:  -30 },
  { id: 'bum',       label: 'Bum',        x:   0, y:   -5 },
  { id: 'hip_l',     label: 'Hip L',      x: -25, y:   -5 },
  { id: 'hip_r',     label: 'Hip R',      x:  25, y:   -5 },
  { id: 'knee_l',    label: 'Knee L',     x: -28, y:   60 },
  { id: 'knee_r',    label: 'Knee R',     x:  28, y:   60 },
  { id: 'foot_l',    label: 'Foot L',     x: -30, y:  130 },
  { id: 'foot_r',    label: 'Foot R',     x:  30, y:  130 },
];

let currentBones = [
  ['head','neck'],
  ['neck','chest'],
  ['chest','shoulder_l'],['chest','shoulder_r'],
  ['shoulder_l','elbow_l'],['shoulder_r','elbow_r'],
  ['elbow_l','hand_l'],['elbow_r','hand_r'],
  ['chest','pelvis'],
  ['pelvis','bum'],
  ['bum','hip_l'],['bum','hip_r'],
  ['hip_l','knee_l'],['hip_r','knee_r'],
  ['knee_l','foot_l'],['knee_r','foot_r'],
];

let currentConstraints = {
  distances: {
    'head-neck': 25,
    'neck-chest': 35,
    'chest-shoulder_l': 40,
    'chest-shoulder_r': 40,
    'shoulder_l-elbow_l': 45,
    'shoulder_r-elbow_r': 45,
    'elbow_l-hand_l': 35,
    'elbow_r-hand_r': 35,
    'chest-pelvis': 80,
    'pelvis-bum': 25,
    'bum-hip_l': 25,
    'bum-hip_r': 25,
    'hip_l-knee_l': 45,
    'hip_r-knee_r': 45,
    'knee_l-foot_l': 50,
    'knee_r-foot_r': 50,
  },
  angles: {
    // Angles at joints
    'neck': { min: -30, max: 30 }, // head-neck-chest
    'shoulder_l': { min: 0, max: 180 },
    'shoulder_r': { min: 0, max: 180 },
    'elbow_l': { min: 0, max: 150 },
    'elbow_r': { min: 0, max: 150 },
    'hip_l': { min: 0, max: 180 },
    'hip_r': { min: 0, max: 180 },
    'knee_l': { min: 0, max: 150 },
    'knee_r': { min: 0, max: 150 },
  }
};

export const NODE_RADIUS = 7;

// Load body definition from JSON
export async function loadBodyDefinition(bodyType) {
  try {
    let filePath = bodyType;
    if (!bodyType.endsWith('.json')) {
      filePath = bodyType + '.json';
    }
    if (!filePath.includes('/')) {
      filePath = 'data/bodies/' + filePath;
    }
    const response = await fetch(filePath);
    if (!response.ok) {
      console.error('Body file not found:', bodyType);
      return null;
    }
    const bodyData = await response.json();

    if (bodyData.nodes && bodyData.nodes.length > 0) {
      currentNodes = bodyData.nodes;
    } else if (bodyData.frames && bodyData.frames[0] && bodyData.frames[0].nodes && bodyData.frames[0].nodes.length > 0) {
      currentNodes = bodyData.frames[0].nodes;
    } else {
      console.error('No nodes found in body definition:', bodyType);
      return null;
    }
    
    currentBones = bodyData.bones || [];
    currentConstraints = bodyData.constraints || { distances: {}, angles: {} };

    return bodyData;
  } catch (error) {
    console.error('Error loading body definition:', error);
    return null;
  }
}

// Get current skeleton data
export function getCurrentNodes() {
  if (!currentNodes || currentNodes.length === 0) {
    console.warn('getCurrentNodes: currentNodes is empty');
    return [];
  }
  return JSON.parse(JSON.stringify(currentNodes));
}

export function getCurrentBones() {
  return currentBones && currentBones.length > 0 ? [...currentBones] : [];
}

export function getCurrentConstraints() {
  return currentConstraints ? JSON.parse(JSON.stringify(currentConstraints)) : { distances: {}, angles: {} };
}

// Constrain a node's position to maintain bone distances
export function constrainDistances(node, x, y, bones, nodes, constraints) {
  if (!constraints || !constraints.distances) {
    return { x, y };
  }

  let constrainedX = x;
  let constrainedY = y;
  const radius = NODE_RADIUS;

  bones.forEach(([a, b]) => {
    const otherId = a === node.id ? b : (b === node.id ? a : null);
    if (!otherId) return;

    const other = nodes.find(n => n.id === otherId);
    if (!other) return;

    const key = [node.id, otherId].sort().join('-');
    const targetDist = constraints.distances[key];
    if (!targetDist) return;

    const dx = x - other.x;
    const dy = y - other.y;
    const dist = Math.hypot(dx, dy);
    const minDist = targetDist - 2 * radius;
    const maxDist = targetDist + 2 * radius;

    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      constrainedX = other.x + Math.cos(angle) * minDist;
      constrainedY = other.y + Math.sin(angle) * minDist;
    } else if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      constrainedX = other.x + Math.cos(angle) * maxDist;
      constrainedY = other.y + Math.sin(angle) * maxDist;
    }
  });

  return { x: constrainedX, y: constrainedY };
}