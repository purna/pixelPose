export function buildHierarchy(bones) {
  const map = {};
  bones.forEach(([a, b]) => {
    if (!map[a]) map[a] = [];
    map[a].push(b);
  });
  return map;
}

export function buildTree(bones, root = 'pelvis') {
  const adj = {};
  bones.forEach(([a, b]) => {
    adj[a] = adj[a] || [];
    adj[b] = adj[b] || [];
    adj[a].push(b);
    adj[b].push(a);
  });
  const parent = {};
  const queue = [root];
  parent[root] = null;
  while (queue.length) {
    const cur = queue.shift();
    (adj[cur] || []).forEach(neighbor => {
      if (parent[neighbor] === undefined) {
        parent[neighbor] = cur;
        queue.push(neighbor);
      }
    });
  }
  const children = {};
  Object.keys(parent).forEach(node => {
    if (node === root) return;
    const p = parent[node];
    if (!children[p]) children[p] = [];
    children[p].push(node);
  });
  return { children, parent, allNodes: Object.keys(parent) };
}

export function computeAllDescendants(children) {
  const descendants = {};
  function dfs(node) {
    if (!children[node]) {
      descendants[node] = [];
      return [];
    }
    let list = [];
    children[node].forEach(child => {
      list.push(child);
      list.push(...dfs(child));
    });
    descendants[node] = list;
    return list;
  }
  Object.keys(children).forEach(node => dfs(node));
  return descendants;
}

export function discoverFootNodes(bones) {
  const children = new Set(bones.map(b => b[1]));
  return bones
    .map(b => b[0])
    .filter(n => !children.has(n) && (n.startsWith('foot') || n.includes('paw') || n.startsWith('hand')));
}

export function calculateGroundY(nodes) {
  const feet = nodes.filter(n => 
    n.id.startsWith('foot') || n.id.includes('paw') || n.id.startsWith('hand')
  );
  if (feet.length > 0) {
    return Math.max(...feet.map(f => f.y)) + 20;
  }
  return 130;
}