from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Chunk:
    text: str
    index: int
    document_id: str
    document_title: str
    page_number: Optional[int] = None


class RecursiveChunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.separators = ["\n\n", "\n", ". ", " "]

    def chunk(self, text: str, document_id: str, document_title: str) -> list[Chunk]:
        if not text.strip():
            return []

        raw_chunks = self._split_recursive(text, self.separators)
        chunks = []
        for i, chunk_text in enumerate(raw_chunks):
            page_number = self._estimate_page(text, chunk_text)
            chunks.append(Chunk(
                text=chunk_text.strip(),
                index=i,
                document_id=document_id,
                document_title=document_title,
                page_number=page_number,
            ))
        return chunks

    def _split_recursive(self, text: str, separators: list[str]) -> list[str]:
        if len(text) <= self.chunk_size:
            return [text] if text.strip() else []

        if not separators:
            # Force split at chunk_size
            return self._force_split(text)

        sep = separators[0]
        parts = text.split(sep)

        chunks = []
        current = ""
        for part in parts:
            candidate = current + sep + part if current else part
            if len(candidate) <= self.chunk_size:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                if len(part) > self.chunk_size:
                    # Recurse with next separator
                    sub_chunks = self._split_recursive(part, separators[1:])
                    chunks.extend(sub_chunks)
                    current = ""
                else:
                    current = part

        if current:
            chunks.append(current)

        # Apply overlap
        return self._apply_overlap(chunks)

    def _force_split(self, text: str) -> list[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            chunks.append(text[start:end])
            start = end - self.overlap if end < len(text) else end
        return chunks

    def _apply_overlap(self, chunks: list[str]) -> list[str]:
        if len(chunks) <= 1:
            return chunks

        result = [chunks[0]]
        for i in range(1, len(chunks)):
            prev = chunks[i - 1]
            overlap_text = prev[-self.overlap:] if len(prev) > self.overlap else prev
            result.append(overlap_text + chunks[i])
        return result

    def _estimate_page(self, full_text: str, chunk_text: str) -> Optional[int]:
        # Check for [Page N] markers
        pos = full_text.find(chunk_text[:100])
        if pos == -1:
            return None

        preceding = full_text[:pos]
        # Count [Page N] markers
        import re
        pages = re.findall(r'\[Page (\d+)\]', preceding)
        if pages:
            return int(pages[-1])

        # Estimate: ~3000 chars per page
        return (pos // 3000) + 1
