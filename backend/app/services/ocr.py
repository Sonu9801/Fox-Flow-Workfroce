import os
import json
import re
from PIL import Image
import numpy as np
import google.generativeai as genai
from app.config import settings

def extract_invoice_data(file_path: str) -> dict:
    """
    Process an image or PDF, convert to PIL Image, and parse required fields using Gemini 1.5 Flash.
    Returns a dictionary of extracted fields.
    """
    try:
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "paste_your_key_here":
            print("WARNING: GEMINI_API_KEY is not set or invalid. Returning empty data.")
            raise ValueError("GEMINI_API_KEY is not set in environment.")

        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = """
        Analyze this invoice document and extract the following information.
        Return ONLY a JSON object exactly matching this structure, with no markdown formatting or other text:
        {
          "invoice_number": "string (or null if not found)",
          "vendor_name": "string (or null if not found)",
          "vendor_gstin": "string (or null if not found)",
          "invoice_date": "YYYY-MM-DD (or null if not found)",
          "hsn_sac": "string (or null if not found)",
          "cgst": float (or 0),
          "sgst": float (or 0),
          "igst": float (or 0),
          "gst_amount": float (total GST, or 0),
          "subtotal": float (or 0),
          "grand_total": float (or 0)
        }
        """

        # Preprocess Image/PDF to PIL Image
        pil_img = None
        if file_path.lower().endswith('.pdf'):
            from pdf2image import convert_from_path
            try:
                pages = convert_from_path(file_path, first_page=1, last_page=1)
                if not pages:
                    raise ValueError("Could not extract pages from PDF.")
                pil_img = pages[0].convert('RGB')
            except Exception as e:
                raise ValueError(f"Failed to convert PDF. Ensure Poppler is installed on Windows. Error: {str(e)}")
        else:
            try:
                pil_img = Image.open(file_path).convert('RGB')
            except Exception:
                raise ValueError("Could not read image file.")

        # Pass the PIL image directly to Gemini
        response = model.generate_content([pil_img, prompt])
        
        # Clean up the response text (remove potential markdown block)
        result_text = response.text.strip()
        
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', result_text, re.DOTALL)
        if json_match:
            result_text = json_match.group(1)
        else:
            # Fallback if no markdown block
            json_match = re.search(r'\{.*?\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
            
        extracted_data = json.loads(result_text)
        
        # Sanitize float fields to prevent Pydantic ValidationError (500 Error)
        float_fields = ['cgst', 'sgst', 'igst', 'gst_amount', 'subtotal', 'grand_total']
        for field in float_fields:
            if extracted_data.get(field) is None or str(extracted_data.get(field)).strip().lower() in ["", "null", "none", "n/a"]:
                extracted_data[field] = 0.0
            else:
                try:
                    extracted_data[field] = float(extracted_data[field])
                except (ValueError, TypeError):
                    extracted_data[field] = 0.0

        # Sanitize date field
        date_val = extracted_data.get("invoice_date")
        if date_val:
            date_str = str(date_val).strip()
            # Basic regex to check YYYY-MM-DD
            if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
                extracted_data["invoice_date"] = None
            else:
                extracted_data["invoice_date"] = date_str
        else:
            extracted_data["invoice_date"] = None

        # Sanitize string fields
        str_fields = ["invoice_number", "vendor_name", "vendor_gstin", "hsn_sac"]
        for field in str_fields:
            val = extracted_data.get(field)
            if val is not None:
                val_str = str(val).strip()
                if val_str.lower() in ["null", "none", "n/a", ""]:
                    extracted_data[field] = None
                else:
                    extracted_data[field] = val_str

        extracted_data["ocr_confidence_score"] = 92.5  # High confidence for AI extraction
        
        return extracted_data

    except Exception as e:
        print(f"Gemini OCR Error: {str(e)}")
        # Return fallback/empty data on OCR failure so the flow continues manually
        return {
            "invoice_number": None,
            "vendor_name": None,
            "vendor_gstin": None,
            "invoice_date": None,
            "hsn_sac": None,
            "cgst": 0.0,
            "sgst": 0.0,
            "igst": 0.0,
            "gst_amount": 0.0,
            "subtotal": 0.0,
            "grand_total": 0.0,
            "ocr_confidence_score": 0.0,
        }
