import sys
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.worker import Worker
from app.models.vehicle import Vehicle
from app.models.quality import QCRecord
from app.models.dispatch import DispatchRecord
from app.models.inventory import InventoryItem
from app.models.activity import ActivityEvent
from app.auth import get_password_hash

def seed_data():
    db = SessionLocal()
    
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    # Check if database already has users or workers
    if db.query(User).first() is not None:
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database...")
    
    # 1. Create Default Users
    admin_user = User(
        username="admin",
        hashed_password=get_password_hash("admin123"),
        role="admin"
    )
    operator_user = User(
        username="operator",
        hashed_password=get_password_hash("operator123"),
        role="operator"
    )
    db.add(admin_user)
    db.add(operator_user)
    db.commit()

    # Base date calculations (2026-05-29 00:00:00 UTC)
    now = datetime(2026, 5, 29)
    day = timedelta(days=1)

    # 2. Add Workers
    worker_data = [
        # name, emp_id, status, current_task_id, hours_today, department, performance_score
        ("Ravi Kumar", "EMP-001", "Active", "1", 6.5, "Fabrication", 92),
        ("Suresh Patel", "EMP-002", "Active", "2", 7.0, "Fabrication", 88),
        ("Anand Singh", "EMP-003", "Break", None, 4.0, "Paint", 85),
        ("Priya Sharma", "EMP-004", "Active", "4", 5.5, "Paint", 90),
        ("Vikram Nair", "EMP-005", "Active", "6", 8.0, "QC", 95),
        ("Deepak Verma", "EMP-006", "Offline", None, 0.0, "Dispatch", 78),
        ("Meena Reddy", "EMP-007", "Active", "8", 6.0, "Fabrication", 87),
        ("Arjun Iyer", "EMP-008", "Active", "10", 7.5, "Assembly", 91),
    ]
    workers = []
    for idx, (name, emp_id, status, task_id, hours, dept, score) in enumerate(worker_data, 1):
        w = Worker(
            id=idx,
            employee_id=emp_id,
            name=name,
            status=status,
            current_task_id=task_id,
            hours_today=hours,
            department=dept,
            performance_score=score
        )
        db.add(w)
        workers.append(w)
    db.commit()

    # 3. Add Vehicles
    vehicle_data = [
        # tracking_id, vehicle_number, product_category, oem_name, priority, current_stage, worker_indices, received_offset, delivery_offset, progress, notes
        ("FF-2024-001", "TN-01-AB-1234", "Cargo Box", "EULER MOTORS", "Urgent", "Fabrication", [1, 2], -5, 2, 45, "Rush order - transformer box"),
        ("FF-2024-002", "MH-02-CD-5678", "Garbage Body", "MONTRA ELECTRIC", "High", "Paint", [3, 4], -8, 3, 75, "Garbage Body for municipality"),
        ("FF-2024-003", "KA-03-EF-9012", "Grocery Cart", "BAJAJ AUTO", "Normal", "ReadyToDispatch", [5], -12, 1, 100, "Grocery Cart for retail"),
        ("FF-2024-004", "GJ-04-GH-3456", "Food Cart", "PIAGGIO", "High", "Received", [], -1, 10, 0, "Food Cart standard"),
        ("FF-2024-005", "RJ-05-IJ-7890", "Garbage Body", "JUPITER ELECTRIC MOBILITY", "Normal", "Fabrication", [7], -4, 5, 30, "Heavy-duty garbage body"),
        ("FF-2024-006", "DL-06-KL-2345", "Food Cart", "TVS MOTORS", "Urgent", "Paint", [4, 8], -7, -1, 80, "Custom food cart - DELAYED"),
        ("FF-2024-007", "UP-07-MN-6789", "Cargo Box", "E NEXT MOBILITY", "Normal", "Dispatched", [6], -15, -2, 100, "Cargo container bracket"),
        ("FF-2024-008", "WB-08-OP-0123", "Grocery Cart", "E AUTO FARIDABAD", "High", "Fabrication", [1], -3, 7, 20, "Grocery Cart enclosure"),
        ("FF-2024-009", "AP-09-QR-4567", "Food Cart", "EULER MOTORS", "Normal", "ReadyToDispatch", [5, 6], -10, 2, 100, "Food Cart delivery"),
        ("FF-2024-010", "TS-10-ST-8901", "Garbage Body", "MONTRA ELECTRIC", "High", "Paint", [3], -6, 4, 65, "MCC panel enclosure"),
        ("FF-2024-011", "KL-11-UV-2345", "Grocery Cart", "BAJAJ AUTO", "Normal", "Received", [], 0, 14, 0, "Scrap collection bins"),
        ("FF-2024-012", "TN-12-WX-6789", "Cargo Box", "PIAGGIO", "Urgent", "Fabrication", [2, 8], -2, 3, 15, "Auto component transport box"),
        ("FF-2024-013", "MH-13-YZ-0123", "Food Cart", "JUPITER ELECTRIC MOBILITY", "Normal", "Fabrication", [7], -5, 6, 40, "Custom display enclosure"),
        ("FF-2024-014", "KA-14-AA-4567", "Garbage Body", "TVS MOTORS", "High", "Paint", [4], -9, 1, 85, "EV battery housing"),
        ("FF-2024-015", "GJ-15-BB-8901", "Grocery Cart", "E NEXT MOBILITY", "Normal", "ReadyToDispatch", [5], -11, 0, 100, "Switchgear enclosure"),
        ("FF-2024-016", "RJ-16-CC-2345", "Food Cart", "E AUTO FARIDABAD", "Urgent", "Fabrication", [1, 7], -3, -1, 50, "Data center wall unit - DELAYED"),
        ("FF-2024-017", "DL-17-DD-6789", "Cargo Box", "EULER MOTORS", "Normal", "Dispatched", [6], -20, -5, 100, "Railway signal box"),
        ("FF-2024-018", "UP-18-EE-0123", "Garbage Body", "MONTRA ELECTRIC", "High", "Fabrication", [2], -4, 8, 25, "Mining equipment storage"),
        ("FF-2024-019", "WB-19-FF-4567", "Grocery Cart", "BAJAJ AUTO", "Normal", "Received", [], 0, 20, 0, "Server room enclosure"),
        ("FF-2024-020", "AP-20-GG-8901", "Food Cart", "PIAGGIO", "High", "Paint", [3, 4], -7, 5, 70, "Satellite battery module housing"),
        ("FF-2024-021", "TS-21-HH-2345", "Cargo Box", "TVS MOTORS", "Urgent", "ReadyToDispatch", [5, 6], -13, 0, 100, "Smart grid panel"),
    ]
    
    vehicles = []
    for idx, (t_id, v_num, cat, oem, prio, stage, w_indices, recv_off, eta_off, prog, notes) in enumerate(vehicle_data, 1):
        v = Vehicle(
            id=idx,
            tracking_id=t_id,
            vehicle_number=v_num,
            product_category=cat,
            oem_name=oem,
            priority=prio,
            current_stage=stage,
            progress_percent=prog,
            notes=notes,
            received_at=now + timedelta(days=recv_off),
            estimated_delivery=now + timedelta(days=eta_off)
        )
        
        # Link assigned workers
        v.workers = [workers[wi - 1] for wi in w_indices]
        db.add(v)
        vehicles.append(v)
    db.commit()

    # 4. Add QC Records
    qc_data = [
        (3, "Vikram Nair", -11, "Pass", [], "All welds clean, dimensions correct", "Fabrication"),
        (2, "Vikram Nair", -7, "Fail", ["Surface rust on left panel", "Weld gap > 2mm"], "Requires rework before paint", "Fabrication"),
        (1, "Vikram Nair", -6, "Pass", [], "Post-rework inspection passed", "Painting"),
        (4, "Vikram Nair", -5, "Pass", [], "Paint coat uniform, no blistering", "Painting"),
        (7, "Priya Sharma", -10, "Pass", [], "Dimensions within tolerance", "Fabrication"),
        (9, "Vikram Nair", -9, "Pass", [], "Telecom cabinet passed IP55 seal test", "Final Assembly"),
        (10, "Priya Sharma", -4, "Pass", [], "MCC panel wiring verified", "Final Assembly"),
        (14, "Vikram Nair", -3, "Fail", ["Paint adhesion failure", "Primer coat thin"], "Needs repaint", "Painting"),
        (15, "Priya Sharma", -2, "Pass", [], "EV battery housing sealed correctly", "Fabrication"),
        (17, "Vikram Nair", -1, "Pass", [], "Switchgear clearances verified", "Final Assembly"),
        (20, "Priya Sharma", -6, "Pass", [], "Custom display enclosure dimensions OK", "Fabrication"),
        (21, "Vikram Nair", -5, "Fail", ["Gasket missing on door", "Hinge alignment off"], "Major rework required", "Final Assembly"),
        (5, "Priya Sharma", -4, "Pass", [], "Smart grid panel functional test passed", "Final Assembly"),
        (8, "Vikram Nair", -3, "Pass", [], "Auto component box load tested", "Final Assembly"),
        (12, "Priya Sharma", -2, "Pass", [], "5G cabinet antenna port aligned", "Final Assembly"),
    ]
    for idx, (v_idx, inspector, off, result, defects, notes, stage) in enumerate(qc_data, 1):
        qc = QCRecord(
            id=idx,
            vehicle_id=v_idx,
            inspector_name=inspector,
            inspected_at=now + timedelta(days=off),
            result=result,
            defects_found=str(defects),
            notes=notes,
            stage=stage
        )
        db.add(qc)
    db.commit()
    # 5. Add Dispatch Records
    # vehicle_idx, date_offset, carrier, status, destination, tracking_number
    dispatch_data = [
        (7, -2, "Blue Dart Logistics", "Delivered", "Mumbai, Maharashtra", "BD-2024-789012"),
        (17, -5, "DHL Express", "Delivered", "Chennai, Tamil Nadu", "DHL-2024-345678"),
        (3, 1, "GATI Courier", "Scheduled", "Jamnagar, Gujarat", "GT-2024-112233"),
        (9, 2, "Ecom Express", "Scheduled", "Hyderabad, Telangana", "EX-2024-445566"),
        (15, 0, "Delhivery", "InTransit", "Bangalore, Karnataka", "DV-2024-778899"),
        (21, 0, "TCI Express", "Scheduled", "Pune, Maharashtra", "TCI-2024-001122"),
        (10, 3, "Blue Dart Logistics", "Scheduled", "Delhi NCR", "BD-2024-334455"),
        (5, 4, "VRL Logistics", "Scheduled", "Rajkot, Gujarat", "VRL-2024-667788"),
        (12, 1, "Safexpress", "InTransit", "Kolkata, West Bengal", "SX-2024-990011"),
        (16, 5, "Mahindra Logistics", "Scheduled", "Ahmedabad, Gujarat", "ML-2024-223344"),
    ]
    for idx, (v_idx, off, carrier, status, dest, track_num) in enumerate(dispatch_data, 1):
        disp = DispatchRecord(
            id=idx,
            vehicle_id=v_idx,
            scheduled_date=now + timedelta(days=off),
            carrier=carrier,
            status=status,
            destination=dest,
            tracking_number=track_num
        )
        db.add(disp)
    db.commit()

    # 6. Add Inventory Items
    inventory_data = [
        ("Steel Sheet 3mm", "STL-3MM-001", 450, 100, "Rack A-1"),
        ("Steel Sheet 5mm", "STL-5MM-002", 280, 80, "Rack A-2"),
        ("Aluminium Sheet 2mm", "ALU-2MM-003", 150, 50, "Rack B-1"),
        ("Zinc Primer Paint", "PNT-ZNC-004", 85, 30, "Paint Store P-1"),
        ("Epoxy Top Coat Blue", "PNT-EBL-005", 40, 20, "Paint Store P-2"),
        ("Piano Hinge 150mm", "HNG-150-006", 320, 100, "Hardware H-1"),
        ("Door Gasket 10mm", "GSK-10M-007", 180, 60, "Hardware H-2"),
        ("M8 Hex Bolt Set", "BLT-M8-008", 2400, 500, "Fastener F-1"),
        ("M10 Hex Bolt Set", "BLT-M10-009", 1800, 400, "Fastener F-2"),
        ("Welding Wire ER70S-6", "WLD-70S-010", 65, 20, "Welding W-1"),
        ("Angle Grinder Disc 4in", "GRD-4IN-011", 90, 25, "Tools T-1"),
        ("Cable Tray 100mm", "CTR-100-012", 120, 40, "Rack C-1"),
        ("DIN Rail 35mm", "DIN-35M-013", 200, 50, "Rack C-2"),
        ("IP Rated Seal Kit", "SLK-IP6-014", 55, 20, "Hardware H-3"),
        ("Stainless Steel Rivet", "RVT-SS-015", 3000, 800, "Fastener F-3"),
    ]
    for idx, (p_name, sku, stock, reorder, loc) in enumerate(inventory_data, 1):
        item = InventoryItem(
            id=idx,
            sku=sku,
            part_name=p_name,
            stock_level=stock,
            reorder_level=reorder,
            location=loc,
            updated_at=now
        )
        db.add(item)
    db.commit()

    # 7. Add Activity Events
    activity_data = [
        # event_type, description, vehicle_idx, worker_idx, offset
        ("worker_started", "Ravi Kumar started fabrication on FF-2024-001", 1, 1, -5),
        ("worker_started", "Suresh Patel started fabrication on FF-2024-002", 2, 2, -8),
        ("stage_changed", "FF-2024-002 moved to Paint stage", 2, None, -4),
        ("qc_passed", "FF-2024-003 passed quality inspection by Vikram Nair", 3, 5, -11),
        ("stage_changed", "FF-2024-003 moved to Ready to Dispatch", 3, None, -11),
        ("qc_failed", "FF-2024-002 failed QC - surface rust detected", 2, 5, -7),
        ("worker_started", "Anand Singh started painting on FF-2024-002", 2, 3, -6),
        ("qc_passed", "FF-2024-002 passed re-inspection after rework", 2, 5, -6),
        ("vehicle_dispatched", "FF-2024-007 dispatched via Blue Dart to Mumbai", 7, 6, -2),
        ("emergency_created", "FF-2024-001 marked URGENT by Tata Power", 1, None, -5),
        ("worker_started", "Priya Sharma started painting on FF-2024-010", 10, 4, -4),
        ("qc_passed", "FF-2024-005 passed initial inspection", 5, 5, -5),
        ("stage_changed", "FF-2024-009 moved to Ready to Dispatch", 9, None, -3),
        ("worker_started", "Meena Reddy started fabrication on FF-2024-013", 13, 7, -5),
        ("qc_failed", "FF-2024-014 failed QC - paint adhesion issue", 14, 5, -3),
        ("worker_started", "Arjun Iyer started assembly on FF-2024-020", 20, 8, -7),
        ("stage_changed", "FF-2024-020 moved to Paint stage", 20, None, -4),
        ("qc_passed", "FF-2024-015 passed final inspection", 15, 5, -2),
        ("stage_changed", "FF-2024-015 moved to Ready to Dispatch", 15, None, -2),
        ("vehicle_dispatched", "FF-2024-017 dispatched via DHL to Chennai", 17, 6, -5),
        ("emergency_created", "FF-2024-006 overdue - escalated to supervisor", 6, None, -1),
        ("worker_started", "Ravi Kumar started on FF-2024-016 (URGENT)", 16, 1, -3),
        ("stage_changed", "FF-2024-021 moved to Ready to Dispatch", 21, None, -1),
        ("worker_started", "Suresh Patel started fabrication on FF-2024-012", 12, 2, -2),
        ("qc_passed", "FF-2024-021 passed smart grid functional test", 21, 5, -1),
    ]
    for idx, (ev_type, desc, v_idx, w_idx, off) in enumerate(activity_data, 1):
        act = ActivityEvent(
            id=idx,
            event_type=ev_type,
            description=desc,
            vehicle_id=v_idx,
            worker_id=w_idx,
            timestamp=now + timedelta(days=off)
        )
        db.add(act)
    db.commit()

    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_data()
