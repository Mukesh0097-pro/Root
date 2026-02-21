import google.generativeai as genai
from ..config import settings


class EmbeddingService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = "models/text-embedding-004"

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        all_embeddings = []
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            result = genai.embed_content(
                model=self.model,
                content=batch,
                task_type="retrieval_document",
            )
            if isinstance(result["embedding"][0], list):
                all_embeddings.extend(result["embedding"])
            else:
                all_embeddings.append(result["embedding"])
        return all_embeddings

    async def embed_query(self, query: str) -> list[float]:
        result = genai.embed_content(
            model=self.model,
            content=query,
            task_type="retrieval_query",
        )
        return result["embedding"]
