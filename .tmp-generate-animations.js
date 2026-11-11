const fs = require('fs');
const path = require('path');

const BODY_DIR = path.join(__dirname, 'data', 'bodies');
const OUT_DIR = path.join(__dirname, 'data', 'animations');
const BODIES = ['adult-male', 'adult-female', 'child', 'horse', 'dog', 'cat'];

const clone = nodes => nodes.map(node => ({ ...node }));
const byId = nodes => new Map(nodes.map(node => [node.id, node]));
const lerp = (a, b, t) => a + (b - a) * t;
const round = value => Math.round(value * 1000) / 1000;

function bendSign(anchor, joint, end) {
  const cross = (end.x - anchor.x) * (joint.y - anchor.y) - (end.y - anchor.y) * (joint.x - anchor.x);
  return cross >= 0 ? 1 : -1;
}

function solveLimb(anchor, target, l1, l2, sign) {
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const distance = Math.max(1e-6, Math.hypot(dx, dy));
  const maxReach = l1 + l2 - 0.01;
  const reach = Math.min(maxReach, distance);
  const ux = dx / distance;
  const uy = dy / distance;
  const a = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const baseX = anchor.x + ux * a;
  const baseY = anchor.y + uy * a;
  return {
    joint: { x: baseX - uy * h * sign, y: baseY + ux * h * sign },
    end: { x: anchor.x + ux * reach, y: anchor.y + uy * reach },
    clamped: reach < distance - 0.01
  };
}

function limbInfo(base, anchorId, jointId, endId) {
  const map = byId(base);
  const anchor = map.get(anchorId);
  const joint = map.get(jointId);
  const end = map.get(endId);
  return {
    anchor, joint, end,
    l1: Math.hypot(joint.x - anchor.x, joint.y - anchor.y),
    l2: Math.hypot(end.x - joint.x, end.y - joint.y),
    sign: bendSign(anchor, joint, end)
  };
}

function shift(node, dx, dy) {
  return { ...node, x: round(node.x + dx), y: round(node.y + dy) };
}

function setNode(nodes, id, x, y) {
  const node = nodes.find(item => item.id === id);
  if (node) {
    node.x = round(x);
    node.y = round(y);
  }
}

function rotate(point, origin, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos
  };
}

function humanJump(baseNodes) {
  const base = clone(baseNodes);
  const bodyIds = ['head', 'neck', 'chest', 'shoulder_l', 'shoulder_r', 'pelvis', 'bum', 'hip_l', 'hip_r'];
  const arms = [
    { shoulder: 'shoulder_l', elbow: 'elbow_l', hand: 'hand_l' },
    { shoulder: 'shoulder_r', elbow: 'elbow_r', hand: 'hand_r' }
  ].map(def => ({ def, ...limbInfo(base, def.shoulder, def.elbow, def.hand) }));
  const legs = [
    { hip: 'hip_l', knee: 'knee_l', foot: 'foot_l' },
    { hip: 'hip_r', knee: 'knee_r', foot: 'foot_r' }
  ].map(def => ({ def, ...limbInfo(base, def.hip, def.knee, def.foot) }));

  const bodyOffsets = [0, 10, 24, 10, -18, -45, -62, -42, -16, 20, 10, 0];
  const armAngles = [0, -20, -35, 20, 80, 130, 150, 120, 55, -15, -5, 0];
  const leanX = [0, 1, 2, 2, 1, 0, -1, -2, -1, 1, 0, 0];

  return bodyOffsets.map((dy, frameIndex) => {
    const nodes = clone(base);
    const dx = leanX[frameIndex];

    for (const id of bodyIds) {
      const node = nodes.find(item => item.id === id);
      if (node) {
        node.x = round(node.x + dx);
        node.y = round(node.y + dy);
      }
    }

    const angle = (armAngles[frameIndex] * Math.PI) / 180;
    for (const arm of arms) {
      const shoulder = shift(arm.anchor, dx, dy);
      const elbow = shift(rotate(arm.joint, arm.anchor, angle), dx, dy);
      const hand = shift(rotate(arm.end, arm.anchor, angle), dx, dy);
      setNode(nodes, arm.def.shoulder, shoulder.x, shoulder.y);
      setNode(nodes, arm.def.elbow, elbow.x, elbow.y);
      setNode(nodes, arm.def.hand, hand.x, hand.y);
    }

    const air = Math.max(0, -dy);
    for (const leg of legs) {
      const anchor = shift(leg.anchor, dx, dy);
      const target = {
        x: leg.end.x + dx + air * 0.06,
        y: leg.end.y + Math.min(0, dy) - air * 0.34
      };
      const solved = solveLimb(anchor, target, leg.l1, leg.l2, leg.sign);
      setNode(nodes, leg.def.hip, anchor.x, anchor.y);
      setNode(nodes, leg.def.knee, solved.joint.x, solved.joint.y);
      setNode(nodes, leg.def.foot, solved.end.x, solved.end.y);
    }

    return nodes;
  });
}

function animalWalkOrRun(baseNodes, mode) {
  const base = clone(baseNodes);
  const bodyIds = ['head', 'upper_neck', 'neck', 'chest', 'shoulder_l', 'shoulder_r', 'pelvis', 'bum', 'hip_l', 'hip_r'];
  const legs = [
    { anchor: 'shoulder_l', joint: 'elbow_l', end: 'hand_l', phase: 0.25, front: true },
    { anchor: 'shoulder_r', joint: 'elbow_r', end: 'hand_r', phase: 0.75, front: true },
    { anchor: 'hip_l', joint: 'knee_l', end: 'foot_l', phase: 0.0, front: false },
    { anchor: 'hip_r', joint: 'knee_r', end: 'foot_r', phase: 0.5, front: false }
  ].map(def => ({ def, ...limbInfo(base, def.anchor, def.joint, def.end) }));

  const groundY = legs.reduce((sum, leg) => sum + leg.end.y, 0) / legs.length;
  const avgLeg = legs.reduce((sum, leg) => sum + leg.l1 + leg.l2, 0) / legs.length;
  const run = mode === 'run';
  const frames = 8;
  const stride = avgLeg * (run ? 0.98 : 0.48);
  const lift = avgLeg * (run ? 0.22 : 0.09);
  const bob = avgLeg * (run ? 0.075 : 0.032);
  const stanceRatio = run ? 0.46 : 0.64;
  const bodyCenterX = (legs.find(leg => leg.def.front).anchor.x + legs.find(leg => !leg.def.front).anchor.x) / 2;

  const result = [];
  for (let frame = 0; frame < frames; frame++) {
    const cycle = frame / frames;
    const nodes = clone(base);
    const dy = Math.sin(cycle * Math.PI * 4) * bob;
    const dx = Math.sin(cycle * Math.PI * 2) * (run ? 3 : 1.5);

    for (const id of bodyIds) {
      const node = nodes.find(item => item.id === id);
      if (node) {
        node.x = round(node.x + dx);
        node.y = round(node.y + dy);
      }
    }

    for (const leg of legs) {
      const phase = (cycle + leg.def.phase) % 1;
      let targetX;
      let targetY;
      if (phase < stanceRatio) {
        const t = phase / stanceRatio;
        targetX = leg.end.x + stride * (0.5 - t);
        targetY = groundY + (leg.end.y - groundY) * 0.08;
      } else {
        const t = (phase - stanceRatio) / (1 - stanceRatio);
        targetX = leg.end.x - stride * 0.5 + stride * t;
        targetY = groundY + (leg.end.y - groundY) * 0.08 - Math.sin(t * Math.PI) * lift;
      }

      const anchor = shift(leg.anchor, dx, dy);
      let solved = solveLimb(anchor, { x: targetX, y: targetY }, leg.l1, leg.l2, leg.sign);
      let target = { x: solved.end.x, y: solved.end.y };

      if (solved.clamped) {
        // Prefer keeping the paw near the ground rather than stretching the leg.
        target = {
          x: lerp(targetX, solved.end.x, 0.6),
          y: lerp(targetY, solved.end.y, 0.6)
        };
        solved = solveLimb(anchor, target, leg.l1, leg.l2, leg.sign);
      }

      setNode(nodes, leg.def.anchor, anchor.x, anchor.y);
      setNode(nodes, leg.def.joint, solved.joint.x, solved.joint.y);
      setNode(nodes, leg.def.end, solved.end.x, solved.end.y);
    }

    result.push(nodes);
  }
  return result;
}

function animalJump(baseNodes) {
  const base = clone(baseNodes);
  const bodyIds = ['head', 'upper_neck', 'neck', 'chest', 'shoulder_l', 'shoulder_r', 'pelvis', 'bum', 'hip_l', 'hip_r'];
  const legs = [
    { anchor: 'shoulder_l', joint: 'elbow_l', end: 'hand_l', front: true },
    { anchor: 'shoulder_r', joint: 'elbow_r', end: 'hand_r', front: true },
    { anchor: 'hip_l', joint: 'knee_l', end: 'foot_l', front: false },
    { anchor: 'hip_r', joint: 'knee_r', end: 'foot_r', front: false }
  ].map(def => ({ def, ...limbInfo(base, def.anchor, def.joint, def.end) }));

  const avgLeg = legs.reduce((sum, leg) => sum + leg.l1 + leg.l2, 0) / legs.length;
  const bodyOffsets = [0, 8, 18, 10, -22, -48, -66, -48, -20, 10, 4, 0]
    .map(value => value * (avgLeg / 150));
  const result = [];

  for (let frame = 0; frame < bodyOffsets.length; frame++) {
    const dy = bodyOffsets[frame];
    const nodes = clone(base);
    const dx = Math.sin((frame / (bodyOffsets.length - 1)) * Math.PI * 2) * 2;

    for (const id of bodyIds) {
      const node = nodes.find(item => item.id === id);
      if (node) {
        node.x = round(node.x + dx);
        node.y = round(node.y + dy);
      }
    }

    const air = Math.max(0, -dy);
    for (const leg of legs) {
      const anchor = shift(leg.anchor, dx, dy);
      const tuckDirection = leg.def.front ? 1 : -1;
      const target = {
        x: leg.end.x + dx + tuckDirection * air * 0.22,
        y: leg.end.y + Math.min(0, dy) - air * 0.28
      };
      const solved = solveLimb(anchor, target, leg.l1, leg.l2, leg.sign);
      setNode(nodes, leg.def.anchor, anchor.x, anchor.y);
      setNode(nodes, leg.def.joint, solved.joint.x, solved.joint.y);
      setNode(nodes, leg.def.end, solved.end.x, solved.end.y);
    }

    result.push(nodes);
  }
  return result;
}

function frameData(nodes) {
  return nodes.map((frame, index) => ({ nodes: frame, label: `Frame ${index + 1}` }));
}

function writeAnimation(fileName, body, frames, name, description) {
  const data = {
    name,
    author: 'PixelPose',
    description,
    category: body.category,
    bodyType: body.bodyType,
    height: body.height,
    direction: body.direction || 'left',
    frames: frameData(frames)
  };
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

function validateAnimation(data, label) {
  let maxStretch = 0;
  for (const frame of data.frames) {
    const map = byId(frame.nodes);
    for (const [a, b] of [
      ['hip_l', 'knee_l'], ['knee_l', 'foot_l'], ['hip_r', 'knee_r'], ['knee_r', 'foot_r'],
      ['shoulder_l', 'elbow_l'], ['elbow_l', 'hand_l'], ['shoulder_r', 'elbow_r'], ['elbow_r', 'hand_r']
    ]) {
      const na = map.get(a);
      const nb = map.get(b);
      if (na && nb) {
        const len = Math.hypot(nb.x - na.x, nb.y - na.y);
        if (len > maxStretch) maxStretch = len;
      }
    }
  }
  console.log(`${label}: ${data.frames.length} frames, max limb length ${maxStretch.toFixed(1)}`);
}

const bodyData = {};
for (const name of BODIES) {
  const body = JSON.parse(fs.readFileSync(path.join(BODY_DIR, `${name}.json`), 'utf8'));
  bodyData[name] = body;
  const base = body.frames[0].nodes;
  const labelBase = body.name.split(' ')[0];

  const jump = writeAnimation(
    `jump-cycle-${name === 'adult-male' ? 'male' : name === 'adult-female' ? 'female' : name}.json`,
    body,
    name === 'adult-male' || name === 'adult-female' || name === 'child'
      ? humanJump(base)
      : animalJump(base),
    name === 'adult-male' || name === 'adult-female' || name === 'child'
      ? `Jump Cycle - ${labelBase} (Side View)`
      : `${labelBase} Jump`,
    `Example jump animation for ${name}.`
  );
  validateAnimation(jump, `${name} jump`);
}

for (const name of ['horse', 'dog', 'cat']) {
  const body = bodyData[name];
  const base = body.frames[0].nodes;
  const title = name.charAt(0).toUpperCase() + name.slice(1);

  const walk = writeAnimation(
    `walk-cycle-${name}.json`,
    body,
    animalWalkOrRun(base, 'walk'),
    `${title} Walk`,
    `Example walk cycle for ${name}.`
  );
  validateAnimation(walk, `${name} walk`);

  const run = writeAnimation(
    `run-cycle-${name}.json`,
    body,
    animalWalkOrRun(base, 'run'),
    `${title} Run`,
    `Example run cycle for ${name}.`
  );
  validateAnimation(run, `${name} run`);
}

console.log('Generated example animations.');
