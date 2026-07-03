import os, re

def replace_in_file(path, old, new):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def regex_replace(path, pattern, new):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(pattern, new, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. index.ts
idx = 'src/types/index.ts'
replace_in_file(idx, 'workers?: Worker[];', 'workers?: Worker[];\n  qcStatus?: string;')
replace_in_file(idx, 'salaryProfile?: SalaryProfile;', 'salaryProfile?: SalaryProfile;\n  attendance?: any;\n  salary?: any;')

# 2. page.tsx (dashboard)
dpage = 'src/app/(dashboard)/page.tsx'
replace_in_file(dpage, 'oem_submitted:', 'oem:')
replace_in_file(dpage, 'Record<Stage, Vehicle[]>', 'Partial<Record<Stage, Vehicle[]>>')
replace_in_file(dpage, 'Record<Stage, string>', 'Partial<Record<Stage, string>>')
replace_in_file(dpage, ']: [] as Vehicle[]', ']: []')
replace_in_file(dpage, 'as Record<Stage, Vehicle[]>', 'as Partial<Record<Stage, Vehicle[]>>')

# 3. StatusBadge.tsx
replace_in_file('src/components/ui/StatusBadge.tsx', 'oem_submitted:', 'oem:')
replace_in_file('src/components/ui/StatusBadge.tsx', 'Record<Stage, {', 'Partial<Record<Stage, {')

# 4. production/page.tsx
ppage = 'src/app/(dashboard)/production/page.tsx'
replace_in_file(ppage, 'interface VehicleCardProps {', 'interface VehicleCardProps {\n  workerMap?: Record<string, string>;')
replace_in_file(ppage, 'as Record<Stage, Vehicle[]>', 'as Partial<Record<Stage, Vehicle[]>>')
replace_in_file(ppage, '{ rejected: [] }', '{ rejected: [] } as Partial<Record<Stage, Vehicle[]>>')

# 5. quality-control/page.tsx
replace_in_file('src/app/(dashboard)/quality-control/page.tsx', 'v.id === d.vehicleId', 'v.id === d.vehicleId.toString()')

# 6. reports
edash = 'src/app/(dashboard)/reports/components/ExecutiveDashboardTab.tsx'
replace_in_file(edash, '"ReadyToDispatch"', '"rtd"')
replace_in_file(edash, '"Dispatched"', '"dispatch"')

rpage = 'src/app/(dashboard)/reports/page.tsx'
replace_in_file(rpage, 'd.vehicleId === Number(id)', 'd.vehicleId.toString() === id.toString()')
replace_in_file(rpage, 'q.vehicleId === Number(id)', 'q.vehicleId.toString() === id.toString()')
replace_in_file(rpage, '=== v.id', '=== v.id.toString()')
replace_in_file(rpage, 'v.id === d.vehicleId', 'v.id === d.vehicleId.toString()')
replace_in_file(rpage, '=== q.vehicleId', '=== q.vehicleId.toString()')

# 7. vehicle/[id]/page.tsx
vpage = 'src/app/(dashboard)/vehicle/[id]/page.tsx'
replace_in_file(vpage, 'new Date(record.inspectedAt)', 'new Date(record.inspectedAt || "")')
replace_in_file(vpage, 'record.defectsFound > 0', '(record.defectsFound || 0) > 0')
replace_in_file(vpage, '{record.defectsFound}', '{record.defectsFound || 0}')

# 8. WorkerJobs.tsx
wj = 'src/app/workforce/WorkerJobs.tsx'
replace_in_file(wj, 'import { Card } from "@/components/ui/card";', 'import { Card } from "@/components/ui/card";\nimport { Badge } from "@/components/ui/badge";')

# 9. AssignJobDialog.tsx
aj = 'src/components/vehicles/AssignJobDialog.tsx'
replace_in_file(aj, 'const { user } = useAuthStore();', 'const { user } = useAuthStore() as any;')
