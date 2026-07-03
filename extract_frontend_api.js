const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const frontendFiles = walk('c:/Users/skhjp/Downloads/Fox-Flow-Workfroce-main/Fox-Flow-Workfroce-main/frontend/src');
const apiCalls = new Set();
// A simple regex to find api.get('/...'), api.post(`/...`), etc.
const regex = /api\.(get|post|put|patch|delete)\(\s*['"`]([^'"`?]+)/g;

frontendFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    let route = match[2];
    // Convert template literals like /workers/${id} to /workers/{id}
    route = route.replace(/\$\{[^}]+\}/g, '{id}');
    if(route.startsWith('http')) continue; // Skip full urls
    apiCalls.add(match[1].toUpperCase() + ' ' + route);
  }
});

console.log('--- Frontend API Calls ---');
Array.from(apiCalls).sort().forEach(c => console.log(c));
