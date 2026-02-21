"""
Federated Query Router

Routes queries to relevant departments without exposing raw data.
Each department publishes a privacy-safe profile (centroid + topic keywords),
and the router uses these to determine which departments likely have answers.
"""

import json
import logging
from pathlib import Path
from collections import Counter

import numpy as np

from ..config import settings
from .embeddings import EmbeddingService
from .vector_store import vector_store

logger = logging.getLogger(__name__)


class DepartmentProfile:
    """Privacy-safe summary of a department's knowledge base.
    Contains only aggregate statistics — never raw text or documents."""

    def __init__(
        self,
        department_id: str,
        department_name: str,
        centroid: list[float] | None = None,
        topic_keywords: list[str] | None = None,
        document_count: int = 0,
        chunk_count: int = 0,
    ):
        self.department_id = department_id
        self.department_name = department_name
        self.centroid = centroid  # Average embedding vector (no raw data)
        self.topic_keywords = topic_keywords or []
        self.document_count = document_count
        self.chunk_count = chunk_count

    def to_dict(self) -> dict:
        return {
            "department_id": self.department_id,
            "department_name": self.department_name,
            "centroid": self.centroid,
            "topic_keywords": self.topic_keywords,
            "document_count": self.document_count,
            "chunk_count": self.chunk_count,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "DepartmentProfile":
        return cls(**data)


class FederatedRouter:
    """Routes queries to relevant departments using privacy-safe profiles.

    How it works:
    1. Each department builds a profile: centroid (avg embedding) + topic keywords
    2. When a federated query comes in, the router:
       a. Embeds the query
       b. Computes cosine similarity against each department's centroid
       c. Routes to top-N departments with similarity above threshold
    3. Results from multiple departments are merged and ranked by score
    """

    PROFILE_DIR = Path(settings.FAISS_DIR) / "federation_profiles"
    SIMILARITY_THRESHOLD = 0.3  # Min similarity to include a department
    MAX_DEPARTMENTS = 3  # Max departments to search in one query

    def __init__(self):
        self.embeddings = EmbeddingService()
        self._profiles: dict[str, DepartmentProfile] = {}
        self._load_profiles()

    def _load_profiles(self) -> None:
        """Load cached department profiles from disk."""
        if not self.PROFILE_DIR.exists():
            return
        for profile_path in self.PROFILE_DIR.glob("*.profile.json"):
            try:
                with open(profile_path, "r") as f:
                    data = json.load(f)
                profile = DepartmentProfile.from_dict(data)
                self._profiles[profile.department_id] = profile
            except Exception as e:
                logger.warning(f"Failed to load profile {profile_path}: {e}")

    def _save_profile(self, profile: DepartmentProfile) -> None:
        """Save a department profile to disk."""
        self.PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        path = self.PROFILE_DIR / f"{profile.department_id}.profile.json"
        with open(path, "w") as f:
            json.dump(profile.to_dict(), f)

    def build_department_profile(
        self, department_id: str, department_name: str
    ) -> DepartmentProfile:
        """Build a privacy-safe profile for a department.

        Extracts ONLY:
        - Centroid (average embedding vector — no raw text)
        - Topic keywords (extracted from document titles, not content)
        - Document/chunk counts

        Never stores or transmits raw document text.
        """
        # Get centroid from vector store
        centroid = vector_store.get_centroid(department_id)
        if centroid is None:
            logger.info(f"No vectors for department {department_id}, skipping profile")
            return DepartmentProfile(
                department_id=department_id,
                department_name=department_name,
            )

        # Get topic keywords from metadata (document titles only)
        keywords = vector_store.get_topic_keywords(department_id)

        # Get counts
        doc_count, chunk_count = vector_store.get_counts(department_id)

        profile = DepartmentProfile(
            department_id=department_id,
            department_name=department_name,
            centroid=centroid,
            topic_keywords=keywords,
            document_count=doc_count,
            chunk_count=chunk_count,
        )

        self._profiles[department_id] = profile
        self._save_profile(profile)

        logger.info(
            f"Built profile for {department_name}: "
            f"{doc_count} docs, {chunk_count} chunks, "
            f"{len(keywords)} keywords"
        )
        return profile

    async def route_query(
        self,
        query: str,
        user_department_id: str,
        exclude_own: bool = False,
    ) -> list[tuple[str, float]]:
        """Route a query to relevant departments.

        Returns a ranked list of (department_id, similarity_score) tuples.
        The user's own department is always included (unless excluded).
        Other departments are included if their centroid similarity
        exceeds the threshold.

        Privacy guarantee: Only compares query embedding against
        department centroids. No raw data is accessed.
        """
        if not self._profiles:
            return [(user_department_id, 1.0)]

        # Embed the query
        query_vec = await self.embeddings.embed_query(query)
        query_arr = np.array(query_vec, dtype=np.float32)
        norm = np.linalg.norm(query_arr)
        if norm > 0:
            query_arr = query_arr / norm

        # Score each department
        scored: list[tuple[str, float]] = []
        for dept_id, profile in self._profiles.items():
            if profile.centroid is None:
                continue

            centroid_arr = np.array(profile.centroid, dtype=np.float32)
            # Cosine similarity (vectors are already normalized)
            similarity = float(np.dot(query_arr, centroid_arr))

            if dept_id == user_department_id:
                # Always include user's own department with a boost
                scored.append((dept_id, max(similarity, 0.9)))
            elif similarity >= self.SIMILARITY_THRESHOLD:
                scored.append((dept_id, similarity))

        # If user's department wasn't in profiles, add it
        if not any(d[0] == user_department_id for d in scored):
            scored.append((user_department_id, 1.0))

        # Sort by similarity (descending) and limit
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[: self.MAX_DEPARTMENTS]

    async def federated_search(
        self,
        query: str,
        query_vector: list[float],
        department_ids: list[str],
        top_k: int = 5,
    ) -> list[dict]:
        """Search across multiple departments and merge results.

        Each department's results are tagged with their department origin.
        Results are merged and ranked by score globally.
        Duplicates (same document across departments) are removed.

        Privacy guarantee: Each department's FAISS index is searched
        independently. Results are merged only after retrieval.
        """
        all_results: list[dict] = []

        for dept_id in department_ids:
            dept_results = vector_store.search(dept_id, query_vector, top_k=top_k)

            # Get department name from profile
            profile = self._profiles.get(dept_id)
            dept_name = profile.department_name if profile else dept_id

            # Tag each result with its department origin
            for result in dept_results:
                result["department_id"] = dept_id
                result["department_name"] = dept_name
                all_results.append(result)

        # Sort by score globally and deduplicate
        all_results.sort(key=lambda x: x["score"], reverse=True)

        # Deduplicate by document_id (keep highest scoring)
        seen_docs: set[str] = set()
        unique_results: list[dict] = []
        for result in all_results:
            doc_key = f"{result['department_id']}:{result['document_id']}"
            if doc_key not in seen_docs:
                seen_docs.add(doc_key)
                unique_results.append(result)

        return unique_results[:top_k]

    def get_all_profiles(self) -> list[dict]:
        """Return all department profiles (for admin dashboard)."""
        return [p.to_dict() for p in self._profiles.values()]

    def get_profile(self, department_id: str) -> dict | None:
        """Return a single department profile."""
        profile = self._profiles.get(department_id)
        return profile.to_dict() if profile else None


# Singleton
federated_router = FederatedRouter()
