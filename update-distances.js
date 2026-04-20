const fs = require('fs');
const path = require('path');

const SCALE = 2;
const bodiesDir = path.join(__dirname, 'data', 'bodies');

function computeDoubledDistances(nodes, bones) {
  const distances = {};
  bones.forEach(([aId, bId]) => {
    const a = nodes.find(n => n.id === aId);
    const b = nodes.find(n => n.id === bId);
    if (a && b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const actualDist = Math.hypot(dx, dy);
      const key = [aId, bId].sort().join('-');
      distances[key] = Math.round(actualDist * SCALE * 10) / 10;
    }
  });
  return distances;
}

fs.readdir(bodiesDir, (err, files) => {
  if (err) {
    console.error('Error reading bodies directory:', err);
    process.exit(1);
  }

  let totalUpdated = 0;
  files.filter(f => f.endsWith('.json')).forEach(file => {
    const filePath = path.join(bodiesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let nodes = [];
    if (data.frames && data.frames.length > 0 && data.frames[0].nodes) {
      nodes = data.frames[0].nodes;
    } else if (data.nodes) {
      nodes = data.nodes;
    }

    const bones = data.bones || [];
    if (nodes.length === 0 || bones.length === 0) {
      console.warn(`⚠️  Skipping ${file}: missing nodes or bones`);
      return;
    }

    const newDistances = computeDoubledDistances(nodes, bones);
    data.constraints = data.constraints || {};
    data.constraints.distances = newDistances;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    if (totalUpdated === 0) {
      console.log('\n📄 Sample changes (first file):');
      let count = 0;
      Object.entries(newDistances).forEach(([key, val]) => {
        if (count < 5) {
          console.log(`   ${key}: ${val}`);
          count++;
        }
      });
    }
    
    console.log(`✅ ${file}`);
    totalUpdated++;
  });

  console.log(`\n✨ Updated ${totalUpdated} body files with 2× scaled distances`);
});
