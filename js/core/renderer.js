import { state } from './state.js';
import { BODY_PARTS, drawBodyPart } from './bodyParts.js';

const NODE_RADIUS = 7;
const imageCache = {};

export function loadBodyImages(imagePaths) {
  Object.entries(imagePaths).forEach(([key, path]) => {
    if (!imageCache[path]) {
      const img = new Image();
      img.src = path;
      imageCache[path] = img;
    }
  });
  return imageCache;
}

export function getImageForKey(key, imagePaths) {
  const path = imagePaths?.[key];
  if (path && imageCache[path]) {
    return imageCache[path];
  }
  return null;
}

export function render(ctx, canvas, st) {
  const { view, spriteBox } = st;
  const w = canvas.width, h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2 + view.panOffset.x;
  const cy = h / 2 + view.panOffset.y;

  ctx.save();
  ctx.translate(cx, cy);

  if (view.showGrid) {
    ctx.strokeStyle = 'rgba(40,40,60,0.8)';
    ctx.lineWidth = 1;
    const step = 40;
    const range = 1200;
    for (let x = -range; x <= range; x += step) {
      ctx.beginPath(); ctx.moveTo(x, -range); ctx.lineTo(x, range); ctx.stroke();
    }
    for (let y = -range; y <= range; y += step) {
      ctx.beginPath(); ctx.moveTo(-range, y); ctx.lineTo(range, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,255,204,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-range, 0); ctx.lineTo(range, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -range); ctx.lineTo(0, range); ctx.stroke();
  }

  // Floor contact line
  const floorY = 150 * view.charScale;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-400, floorY); ctx.lineTo(400, floorY); ctx.stroke();

  // Ground lines and shadow - only when showShadow is enabled
  if (view.showShadow) {
    const groundY = 145 * view.charScale;
    ctx.strokeStyle = 'rgba(0,255,204,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(-300, groundY); ctx.lineTo(300, groundY); ctx.stroke();
    ctx.setLineDash([]);

    // Ground shadow ellipse
    ctx.save();
    ctx.scale(view.charScale, view.charScale);
    ctx.beginPath();
    ctx.ellipse(0, 142, 45, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,204,0.15)';
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.scale(view.charScale, view.charScale);

  if (view.onionSkin && st.currentFrame > 0 && st.frames.length > 1) {
    const prevSnap = st.frames[st.currentFrame - 1].nodes;
    if (view.spriteMode) {
      drawSpriteSkeleton(ctx, prevSnap, 0.15, st, true);
    } else {
      drawSkeleton(ctx, prevSnap, 0.15, '#7b61ff', st, true);
    }
  }

  if (view.spriteMode) {
    drawSpriteSkeleton(ctx, st.nodes, 1, st, false);
  } else {
    drawSkeleton(ctx, st.nodes, 1, null, st, false);
  }

  if (view.showBoundingBox) {
    const boxW = spriteBox.width / view.charScale;
    const boxH = spriteBox.height / view.charScale;
    const boxX = spriteBox.x / view.charScale;
    const boxBottom = spriteBox.y / view.charScale;
    const top = boxBottom - boxH;

    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2 / view.charScale;
    ctx.strokeRect(boxX - boxW / 2, top, boxW, boxH);

    const handleSize = 12 / view.charScale;
    ctx.fillStyle = '#00ffcc';
    const handles = [
      { x: boxX - boxW / 2, y: top },
      { x: boxX + boxW / 2, y: top },
      { x: boxX - boxW / 2, y: top + boxH },
      { x: boxX + boxW / 2, y: top + boxH },
      { x: boxX, y: top },
      { x: boxX, y: top + boxH },
      { x: boxX - boxW / 2, y: top + boxH },
      { x: boxX + boxW / 2, y: top + boxH },
    ];
    handles.forEach(h => {
      ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    });
  }

  ctx.restore();
  ctx.restore();
}

function drawSpriteSkeleton(ctx, nodeList, alpha, st, isGhost) {
  const N = id => nodeList.find(n => n.id === id);
  const baseAlpha = alpha;

  function drawPartBetween(partId, nodeA, nodeB, offsetA = 0, offsetB = 0) {
    const part = BODY_PARTS[partId];
    if (!part || !nodeA || !nodeB) return;

    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;

    const angle = Math.atan2(dy, dx) - Math.PI / 2;
    const scale = len / part.height;

    ctx.save();
    ctx.translate(nodeA.x, nodeA.y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    drawBodyPart(ctx, partId, baseAlpha);
    ctx.restore();
  }

  const head = N('head'), neck = N('neck');
  if (head && neck) drawPartBetween('head', neck, head);

  const chest = N('chest'), pelvis = N('pelvis'), bum = N('bum');
  if (chest && neck) drawPartBetween('neck', neck, chest);
  if (chest && pelvis) drawPartBetween('torso', chest, pelvis);
  if (chest && bum) drawPartBetween('pelvis', bum, pelvis);

  const hip_l = N('hip_l'), knee_l = N('knee_l'), foot_l = N('foot_l');
  const hip_r = N('hip_r'), knee_r = N('knee_r'), foot_r = N('foot_r');
  if (hip_l && knee_l) drawPartBetween('upper-leg-l', hip_l, knee_l);
  if (knee_l && foot_l) drawPartBetween('lower-leg-l', knee_l, foot_l);
  if (foot_l && knee_l) drawPartBetween('foot-l', knee_l, foot_l);
  if (hip_r && knee_r) drawPartBetween('upper-leg-r', hip_r, knee_r);
  if (knee_r && foot_r) drawPartBetween('lower-leg-r', knee_r, foot_r);
  if (foot_r && knee_r) drawPartBetween('foot-r', knee_r, foot_r);

  const shl = N('shoulder_l'), ell = N('elbow_l'), handl = N('hand_l');
  const shr = N('shoulder_r'), elr = N('elbow_r'), handr = N('hand_r');
  if (shl && ell) drawPartBetween('upper-arm-l', shl, ell);
  if (ell && handl) drawPartBetween('lower-arm-l', ell, handl);
  if (ell && handl) drawPartBetween('hand-l', ell, handl);
  if (shr && elr) drawPartBetween('upper-arm-r', shr, elr);
  if (elr && handr) drawPartBetween('lower-arm-r', elr, handr);
  if (elr && handr) drawPartBetween('hand-r', elr, handr);

  if (!isGhost) {
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawLimb(ctx, ax, ay, bx, by, widthA, widthB, color, alphaVal, image = null) {
  ctx.globalAlpha = alphaVal;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  if (image && image.complete) {
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    const imgWidth = len * 1.1;
    const imgHeight = widthA * 2.5;
    ctx.drawImage(image, 0, -imgHeight / 2, imgWidth, imgHeight);
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }

  const nx = -dy / len, ny = dx / len;

  ctx.beginPath();
  ctx.moveTo(ax + nx * widthA, ay + ny * widthA);
  ctx.lineTo(bx + nx * widthB, by + ny * widthB);
  ctx.lineTo(bx - nx * widthB, by - ny * widthB);
  ctx.lineTo(ax - nx * widthA, ay - ny * widthA);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawSkeleton(ctx, nodeList, alpha, overrideColor, st, isGhost) {
  const ghost = !!overrideColor;

  const N = id => nodeList.find(n => n.id === id);
  const C = st.charColors;

  const colors = {
    body: ghost ? overrideColor : C.body,
    torso: ghost ? overrideColor : '#0d2233',
    armL: ghost ? overrideColor : C.armL,
    armR: ghost ? overrideColor : C.armR,
    legL: ghost ? overrideColor : C.legL,
    legR: ghost ? overrideColor : C.legR,
    head: ghost ? overrideColor : '#00ffcc',
    joint: ghost ? overrideColor : '#00ffcc',
    jointL: ghost ? overrideColor : '#0088ff',
    jointR: ghost ? overrideColor : '#00ff88',
  };

  const baseAlpha = alpha;

  const hip_r = N('hip_r'), knee_r = N('knee_r'), foot_r = N('foot_r');
  if (hip_r && knee_r) drawLimb(ctx, hip_r.x, hip_r.y, knee_r.x, knee_r.y, 7, 5, ghost ? overrideColor : '#003322', baseAlpha * 0.7);
  if (knee_r && foot_r) drawLimb(ctx, knee_r.x, knee_r.y, foot_r.x, foot_r.y, 5, 3, ghost ? overrideColor : '#002211', baseAlpha * 0.7);

  const shr = N('shoulder_r'), elr = N('elbow_r'), handr = N('hand_r');
  if (shr && elr) drawLimb(ctx, shr.x, shr.y, elr.x, elr.y, 5, 4, ghost ? overrideColor : '#003311', baseAlpha * 0.65);
  if (elr && handr) drawLimb(ctx, elr.x, elr.y, handr.x, handr.y, 4, 3, ghost ? overrideColor : '#002200', baseAlpha * 0.65);

  const chest = N('chest'), pelvis = N('pelvis'), bum = N('bum');
  if (chest && pelvis) drawLimb(ctx, chest.x, chest.y, pelvis.x, pelvis.y, 14, 11, colors.torso, baseAlpha);
  if (pelvis && bum) drawLimb(ctx, pelvis.x, pelvis.y, bum.x, bum.y, 11, 13, colors.body, baseAlpha);

  const neck = N('neck');
  if (chest && neck) drawLimb(ctx, neck.x, neck.y, chest.x, chest.y, 5, 7, colors.body, baseAlpha);

  const hip_l = N('hip_l'), knee_l = N('knee_l'), foot_l = N('foot_l');
  if (hip_l && knee_l) drawLimb(ctx, hip_l.x, hip_l.y, knee_l.x, knee_l.y, 8, 6, colors.legL, baseAlpha);
  if (knee_l && foot_l) drawLimb(ctx, knee_l.x, knee_l.y, foot_l.x, foot_l.y, 6, 3, colors.legL, baseAlpha);

  const shl = N('shoulder_l'), ell = N('elbow_l'), handl = N('hand_l');
  if (shl && ell) drawLimb(ctx, shl.x, shl.y, ell.x, ell.y, 6, 5, colors.armL, baseAlpha);
  if (ell && handl) drawLimb(ctx, ell.x, ell.y, handl.x, handl.y, 5, 3, colors.armL, baseAlpha);

  const head = N('head');
  if (head && !ghost) {
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#0d2233';
    ctx.fill();
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(head.x - 5, head.y - 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffcc';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(head.x - 18, head.y + 4, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffcc';
    ctx.fill();
  } else if (head && ghost) {
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = overrideColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (!ghost) {
    nodeList.forEach(n => {
      const isPrimarySelected = st.dragNode && st.dragNode.id === n.id;
      const isMultiSelected = st.selectedNodes.some(sn => sn.id === n.id);
      const isSelected = isPrimarySelected || isMultiSelected;
      if (n.id === 'head') return;

      let jColor = colors.joint;
      if (n.id.includes('_l')) jColor = colors.jointL;
      else if (n.id.includes('_r')) jColor = colors.jointR;

      const r = isSelected ? NODE_RADIUS + 2 : NODE_RADIUS - 2;

      if (isSelected) {
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffcc';
        ctx.fill();
      }

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : jColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    if (st.view.showLabels) {
      nodeList.forEach(n => {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#aabbcc';
        ctx.font = '9px Space Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y - NODE_RADIUS - 4);
      });
    }

    if (st.view.showDistances) {
      drawBoneDistances(ctx, nodeList, st.bones, st);
    }
  }

  ctx.globalAlpha = 1;
}

function drawBoneDistances(ctx, nodes, bones, st) {
  const scale = st.view.charScale;

  bones.forEach(([aId, bId]) => {
    const a = nodes.find(n => n.id === aId);
    const b = nodes.find(n => n.id === bId);
    if (!a || !b) return;

    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    const key = [aId, bId].sort().join('-');
    const targetDist = st.constraints.distances?.[key];

    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(1 / scale, 1 / scale);

    ctx.fillStyle = 'rgba(255, 255, 100, 0.9)';
    ctx.font = 'bold 9px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (targetDist !== undefined) {
      ctx.fillText(targetDist.toFixed(1), 0, 0);
    } else {
      const actual = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.fillText(actual.toFixed(1), 0, 0);
    }

    ctx.restore();
  });
}

export { NODE_RADIUS };