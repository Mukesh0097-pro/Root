import io
from pathlib import Path

import google.generativeai as genai
from ..config import settings


class DocumentProcessor:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)

    async def extract_text(self, file_path: str, file_type: str) -> str:
        extractors = {
            "pdf": self._extract_pdf,
            "docx": self._extract_docx,
            "xlsx": self._extract_xlsx,
            "csv": self._extract_csv,
            "txt": self._extract_txt,
            "md": self._extract_txt,
            "png": self._extract_image,
            "jpg": self._extract_image,
            "jpeg": self._extract_image,
        }
        extractor = extractors.get(file_type.lower(), self._extract_txt)
        return await extractor(file_path)

    async def _extract_pdf(self, file_path: str) -> str:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages.append(f"[Page {i + 1}]\n{text}")
        return "\n\n".join(pages)

    async def _extract_docx(self, file_path: str) -> str:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)

    async def _extract_xlsx(self, file_path: str) -> str:
        import pandas as pd
        xls = pd.ExcelFile(file_path)
        sheets = []
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            sheets.append(f"[Sheet: {sheet_name}]\n{df.to_string(index=False)}")
        return "\n\n".join(sheets)

    async def _extract_csv(self, file_path: str) -> str:
        import pandas as pd
        df = pd.read_csv(file_path)
        return df.to_string(index=False)

    async def _extract_txt(self, file_path: str) -> str:
        return Path(file_path).read_text(encoding="utf-8", errors="replace")

    async def _extract_image(self, file_path: str) -> str:
        from PIL import Image
        img = Image.open(file_path)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            ["Extract all text and describe all content in this image in detail.", img]
        )
        return response.text if response.text else ""
