import json
from pathlib import Path
from typing import Optional

import faiss
import numpy as np

from ..config import settings


class VectorStore:
    """Per-department FAISS index with metadata stored as JSON sidecar."""

    def __init__(self):
        self._indexes: dict[str, faiss.IndexIDMap] = {}
        self._metadata: dict[str, dict[str, dict]] = {}  # dept_id -> {str(faiss_id) -> chunk_meta}
        self._next_ids: dict[str, int] = {}

    def _index_path(self, department_id: str) -> Path:
        return Path(settings.FAISS_DIR) / f"{department_id}.index"

    def _meta_path(self, department_id: str) -> Path:
        return Path(settings.FAISS_DIR) / f"{department_id}.meta.json"

    def _load_or_create(self, department_id: str) -> None:
        if department_id in self._indexes:
            return

        index_path = self._index_path(department_id)
        meta_path = self._meta_path(department_id)

        if index_path.exists() and meta_path.exists():
            self._indexes[department_id] = faiss.read_index(str(index_path))
            with open(meta_path, "r") as f:
                self._metadata[department_id] = json.load(f)
            if self._metadata[department_id]:
                self._next_ids[department_id] = max(int(k) for k in self._metadata[department_id]) + 1
            else:
                self._next_ids[department_id] = 0
        else:
            base_index = faiss.IndexFlatIP(768)  # 768-dim for text-embedding-004
            self._indexes[department_id] = faiss.IndexIDMap(base_index)
            self._metadata[department_id] = {}
            self._next_ids[department_id] = 0

    def _save(self, department_id: str) -> None:
        Path(settings.FAISS_DIR).mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._indexes[department_id], str(self._index_path(department_id)))
        with open(self._meta_path(department_id), "w") as f:
            json.dump(self._metadata[department_id], f)

    def add_vectors(
        self,
        department_id: str,
        vectors: list[list[float]],
        chunk_metadata: list[dict],
    ) -> None:
        self._load_or_create(department_id)

        if not vectors:
            return

        arr = np.array(vectors, dtype=np.float32)
        # L2-normalize for cosine similarity via inner product
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms[norms == 0] = 1
        arr = arr / norms

        start_id = self._next_ids[department_id]
        ids = np.arange(start_id, start_id + len(vectors), dtype=np.int64)
        self._next_ids[department_id] = start_id + len(vectors)

        self._indexes[department_id].add_with_ids(arr, ids)

        for i, meta in enumerate(chunk_metadata):
            self._metadata[department_id][str(ids[i])] = meta

        self._save(department_id)

    def search(
        self,
        department_id: str,
        query_vector: list[float],
        top_k: int = 5,
    ) -> list[dict]:
        self._load_or_create(department_id)

        index = self._indexes[department_id]
        if index.ntotal == 0:
            return []

        arr = np.array([query_vector], dtype=np.float32)
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms[norms == 0] = 1
        arr = arr / norms

        k = min(top_k, index.ntotal)
        scores, ids = index.search(arr, k)

        results = []
        for score, idx in zip(scores[0], ids[0]):
            if idx == -1:
                continue
            meta = self._metadata[department_id].get(str(idx), {})
            results.append({
                "text": meta.get("text", ""),
                "document_id": meta.get("document_id", ""),
                "document_title": meta.get("document_title", ""),
                "page_number": meta.get("page_number"),
                "score": float(score),
            })
        return results

    def remove_document(self, department_id: str, document_id: str) -> None:
        self._load_or_create(department_id)

        # Find all IDs belonging to this document
        ids_to_remove = []
        for str_id, meta in list(self._metadata[department_id].items()):
            if meta.get("document_id") == document_id:
                ids_to_remove.append(int(str_id))
                del self._metadata[department_id][str_id]

        if not ids_to_remove:
            return

        # Rebuild index without removed vectors
        remaining_meta = self._metadata[department_id]
        remaining_ids = [int(k) for k in remaining_meta.keys()]

        if not remaining_ids:
            base_index = faiss.IndexFlatIP(768)
            self._indexes[department_id] = faiss.IndexIDMap(base_index)
            self._next_ids[department_id] = 0
        else:
            # Reconstruct vectors for remaining IDs
            old_index = self._indexes[department_id]
            new_base = faiss.IndexFlatIP(768)
            new_index = faiss.IndexIDMap(new_base)

            for str_id in list(remaining_meta.keys()):
                fid = int(str_id)
                try:
                    vec = np.zeros((1, 768), dtype=np.float32)
                    old_index.reconstruct(fid, vec[0])
                    new_index.add_with_ids(vec, np.array([fid], dtype=np.int64))
                except RuntimeError:
                    del self._metadata[department_id][str_id]

            self._indexes[department_id] = new_index

        self._save(department_id)

    def has_documents(self, department_id: str) -> bool:
        self._load_or_create(department_id)
        return self._indexes[department_id].ntotal > 0

    def get_centroid(self, department_id: str) -> list[float] | None:
        """Compute average embedding vector for a department.

        Privacy guarantee: Returns only an aggregate centroid vector.
        No raw text or document content is exposed.
        """
        self._load_or_create(department_id)

        index = self._indexes[department_id]
        if index.ntotal == 0:
            return None

        # Reconstruct all vectors and compute mean
        n = index.ntotal
        all_ids = list(self._metadata[department_id].keys())
        vectors = []
        for str_id in all_ids:
            fid = int(str_id)
            try:
                vec = np.zeros(768, dtype=np.float32)
                index.reconstruct(fid, vec)
                vectors.append(vec)
            except RuntimeError:
                continue

        if not vectors:
            return None

        centroid = np.mean(vectors, axis=0)
        # Normalize
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        return centroid.tolist()

    def get_topic_keywords(self, department_id: str, top_n: int = 20) -> list[str]:
        """Extract top keywords from document titles in this department.

        Privacy guarantee: Uses only document titles (already visible to
        authorized users), not document content. Returns aggregated
        keywords that don't reveal specific document names.
        """
        self._load_or_create(department_id)

        from collections import Counter

        word_counts: Counter = Counter()
        seen_titles: set[str] = set()

        for meta in self._metadata[department_id].values():
            title = meta.get("document_title", "")
            if title and title not in seen_titles:
                seen_titles.add(title)
                # Simple tokenization — split on common separators
                words = title.lower().replace("_", " ").replace("-", " ").split()
                # Filter short/common words
                stop_words = {
                    "the", "a", "an", "and", "or", "of", "to", "in", "for",
                    "is", "it", "on", "at", "by", "with", "from", "as", "pdf",
                    "docx", "doc", "txt", "csv", "xlsx", "md", "v1", "v2",
                    "final", "draft", "copy", "new", "old", "updated",
                }
                for word in words:
                    if len(word) > 2 and word not in stop_words:
                        word_counts[word] += 1

        return [word for word, _ in word_counts.most_common(top_n)]

    def get_counts(self, department_id: str) -> tuple[int, int]:
        """Return (document_count, chunk_count) for a department."""
        self._load_or_create(department_id)

        doc_ids: set[str] = set()
        chunk_count = 0
        for meta in self._metadata[department_id].values():
            doc_id = meta.get("document_id", "")
            if doc_id:
                doc_ids.add(doc_id)
            chunk_count += 1

        return len(doc_ids), chunk_count


# Singleton instance
vector_store = VectorStore()
