export function solveIK(state, iterations = 30) {
  if (!state.bones || !state.constraints || !state.constraints.distances) return;
  
  const bones = state.bones;
  const constraints = state.constraints.distances;
  const nodes = state.nodes;
  
  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Determine root
  let rootNodeId = 'pelvis';
  if (!nodeMap.has(rootNodeId) && bones.length > 0) {
    rootNodeId = bones[0][0];
  }
  
  const pinned = new Set();
  
  if (state.dragNode) {
    pinned.add(state.dragNode.id);
    // Pin root when dragging anything else
    if (state.dragNode.id !== rootNodeId) {
      pinned.add(rootNodeId);
    }
  }

  // Pre-calculate full constraint map with fast lookups
  const targetDistances = [];
  bones.forEach(([idA, idB]) => {
    const key1 = `${idA}-${idB}`;
    const key2 = `${idB}-${idA}`;
    const targetDist = constraints[key1] || constraints[key2];
    if (targetDist !== undefined) {
      targetDistances.push({
        a: nodeMap.get(idA),
        b: nodeMap.get(idB),
        dist: targetDist
      });
    }
  });

  for (let i = 0; i < iterations; i++) {
    // 1. Enforce length constraints
    for (const constraint of targetDistances) {
      const { a, b, dist } = constraint;
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const currentDist = Math.hypot(dx, dy);
      
      if (currentDist === 0) continue;
      
      const diff = (currentDist - dist) / currentDist;
      const offsetX = dx * diff * 0.5;
      const offsetY = dy * diff * 0.5;
      
      const aPinned = pinned.has(a.id);
      const bPinned = pinned.has(b.id);
      
      if (!aPinned && !bPinned) {
        a.x += offsetX;
        a.y += offsetY;
        b.x -= offsetX;
        b.y -= offsetY;
      } else if (!aPinned && bPinned) {
        a.x += offsetX * 2;
        a.y += offsetY * 2;
      } else if (aPinned && !bPinned) {
        b.x -= offsetX * 2;
        b.y -= offsetY * 2;
      }
    }
    
    // 2. Enforce foot grounding
    if (state.footAnchor && state.FOOT_NODES) {
      state.FOOT_NODES.forEach(fid => {
        const f = nodeMap.get(fid);
        if (f && f.y > state.GROUND_Y) {
          f.y = state.GROUND_Y;
        }
      });
    }
  }
}
