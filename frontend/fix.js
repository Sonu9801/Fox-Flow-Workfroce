const fs = require('fs');
const files = [
  'src/app/(dashboard)/quality-control/page.tsx',
  'src/app/(dashboard)/production/page.tsx',
  'src/app/(dashboard)/workers/page.tsx',
  'src/app/(dashboard)/payroll/components/PayrollEmployeesTab.tsx',
  'src/app/(dashboard)/oem-portal/page.tsx',
  'src/app/(dashboard)/dispatch/page.tsx',
  'src/app/(dashboard)/attendance/components/LogsTab.tsx'
];
let changed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/â€”/g, '—');
  content = content.replace(/â€¦/g, '…');
  content = content.replace(/â”€/g, '─');
  content = content.replace(/â ±/g, '⏱');
  content = content.replace(/â€¢/g, '•');
  content = content.replace(/â‚¹/g, '₹');
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log('Fixed:', file);
  }
}
console.log('Fixed files:', changed);
