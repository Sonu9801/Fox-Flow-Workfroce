import hashlib
from difflib import SequenceMatcher
from sqlalchemy.orm import Session
from app.models.invoice import Invoice

class DuplicateDetectionService:
    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """
        Layer 1: Generate SHA-256 hash of the uploaded file.
        """
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            # Read and update hash string value in blocks of 4K
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    @staticmethod
    def check_hash_exists(db: Session, file_hash: str) -> bool:
        """
        Check if the file hash already exists in the database.
        """
        if not file_hash:
            return False
        return db.query(Invoice).filter(Invoice.file_hash == file_hash).first() is not None

    @staticmethod
    def check_invoice_number(db: Session, invoice_number: str, vendor_name: str) -> bool:
        """
        Layer 2: Compare Invoice Number and Vendor Name.
        """
        if not invoice_number or not vendor_name:
            return False
        return db.query(Invoice).filter(
            Invoice.invoice_number == invoice_number,
            Invoice.vendor_name == vendor_name
        ).first() is not None

    @staticmethod
    def check_business_rules(db: Session, data: dict) -> bool:
        """
        Layer 3: Compare Invoice Number, Vendor GSTIN, Invoice Date, Grand Total, and GST Amount.
        """
        invoice_number = data.get("invoice_number")
        vendor_gstin = data.get("vendor_gstin")
        invoice_date = data.get("invoice_date")
        grand_total = data.get("grand_total")
        gst_amount = data.get("gst_amount")

        if not invoice_number or not vendor_gstin:
            return False

        # Strictly check for identical record
        return db.query(Invoice).filter(
            Invoice.invoice_number == invoice_number,
            Invoice.vendor_gstin == vendor_gstin,
            Invoice.invoice_date == invoice_date,
            Invoice.grand_total == grand_total,
            Invoice.gst_amount == gst_amount
        ).first() is not None

    @staticmethod
    def calculate_similarity(db: Session, data: dict) -> bool:
        """
        Layer 4: OCR Similarity Validation.
        Check recent invoices and compute similarity across key fields.
        Returns True if a highly similar invoice (>95%) is found.
        """
        # Fetch recent invoices to compare against to avoid massive full-table scans
        # In a real heavy system we'd limit this or query by vendor first
        recent_invoices = db.query(Invoice).order_by(Invoice.id.desc()).limit(1000).all()
        
        target_str = f"{data.get('vendor_name')} {data.get('invoice_number')} {data.get('invoice_date')} {data.get('grand_total')} {data.get('gst_amount')}".lower()
        
        for inv in recent_invoices:
            inv_str = f"{inv.vendor_name} {inv.invoice_number} {inv.invoice_date} {inv.grand_total} {inv.gst_amount}".lower()
            similarity = SequenceMatcher(None, target_str, inv_str).ratio()
            
            if similarity > 0.95:
                return True
                
        return False
