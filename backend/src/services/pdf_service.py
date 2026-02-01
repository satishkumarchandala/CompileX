from io import BytesIO
from pdfminer.high_level import extract_text

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        bio = BytesIO(pdf_bytes)
        text = extract_text(bio)
        return text or ''
    except Exception:
        return ''
