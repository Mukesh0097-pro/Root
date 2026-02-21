import json
from typing import AsyncGenerator

import google.generativeai as genai

from ..config import settings
from .embeddings import EmbeddingService
from .vector_store import vector_store
from .federated_router import federated_router


class RAGEngine:
    def __init__(self):
        self.embeddings = EmbeddingService()
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    async def query_stream(
        self,
        question: str,
        department_id: str,
        conversation_history: list[dict] | None = None,
        federated: bool = False,
    ) -> AsyncGenerator[dict, None]:
        # 1. Embed the query
        query_vec = await self.embeddings.embed_query(question)

        # 2. Determine which departments to search
        if federated:
            # Federated mode: route query to relevant departments
            routed_depts = await federated_router.route_query(
                query=question,
                user_department_id=department_id,
            )
            dept_ids = [dept_id for dept_id, _ in routed_depts]

            # Emit federated routing info to the client
            routing_info = [
                {
                    "department_id": d_id,
                    "similarity": round(score, 3),
                    "department_name": (
                        federated_router._profiles[d_id].department_name
                        if d_id in federated_router._profiles
                        else d_id
                    ),
                }
                for d_id, score in routed_depts
            ]
            yield {
                "event": "federation_routing",
                "data": json.dumps(routing_info),
            }

            # Search across all routed departments
            results = await federated_router.federated_search(
                query=question,
                query_vector=query_vec,
                department_ids=dept_ids,
                top_k=5,
            )
        else:
            # Standard mode: search only user's department
            results = vector_store.search(department_id, query_vec, top_k=5)
            # Tag results with department info for consistency
            for r in results:
                r["department_id"] = department_id
                r["department_name"] = ""

        # 3. Build context from retrieved chunks
        if not results:
            yield {
                "event": "content",
                "data": json.dumps(
                    {
                        "text": "I don't have any documents to reference yet. Please upload some documents first, and then I'll be able to answer your questions based on that knowledge."
                    }
                ),
            }
            yield {"event": "sources", "data": json.dumps([])}
            yield {
                "event": "suggestions",
                "data": json.dumps(
                    [
                        "How do I upload documents?",
                        "What file types are supported?",
                    ]
                ),
            }
            yield {"event": "done", "data": json.dumps({"confidence": 0.0})}
            return

        context_parts = []
        for i, r in enumerate(results):
            page_info = (
                f" (Page {r['page_number']})" if r.get("page_number") else ""
            )
            dept_tag = ""
            if federated and r.get("department_name"):
                dept_tag = f" [{r['department_name']}]"
            context_parts.append(
                f"[Source {i+1}: {r['document_title']}{page_info}{dept_tag}]\n{r['text']}"
            )
        context = "\n\n---\n\n".join(context_parts)

        # 4. Build prompt
        if federated:
            system_prompt = (
                "You are FedKnowledge AI, a federated enterprise knowledge assistant. "
                "You have access to knowledge from multiple departments via federated search. "
                "Answer the user's question based ONLY on the provided context documents. "
                "If the context doesn't contain enough information, say so clearly. "
                "Always cite your sources using [Source: document title, Department, Page X] format. "
                "When information comes from different departments, clearly indicate which "
                "department each piece of information originates from. "
                "Be specific, concise, and helpful. Use markdown formatting for readability."
            )
        else:
            system_prompt = (
                "You are FedKnowledge AI, an enterprise knowledge assistant. "
                "Answer the user's question based ONLY on the provided context documents. "
                "If the context doesn't contain enough information, say so clearly. "
                "Always cite your sources using [Source: document title, Page X] format when referencing specific information. "
                "Be specific, concise, and helpful. Use markdown formatting for readability."
            )

        # Build conversation context
        messages_context = ""
        if conversation_history:
            recent = conversation_history[-6:]  # Last 3 exchanges
            for msg in recent:
                role_label = "User" if msg["role"] == "user" else "Assistant"
                messages_context += f"{role_label}: {msg['content']}\n\n"

        full_prompt = f"{system_prompt}\n\nContext Documents:\n{context}"
        if messages_context:
            full_prompt += f"\n\nRecent Conversation:\n{messages_context}"
        full_prompt += f"\n\nUser Question: {question}"

        # 5. Stream response
        try:
            response = self.model.generate_content(full_prompt, stream=True)
            full_text = ""
            for chunk in response:
                if chunk.text:
                    full_text += chunk.text
                    yield {
                        "event": "content",
                        "data": json.dumps({"text": chunk.text}),
                    }

            # 6. Build sources
            sources = []
            for r in results:
                source_entry = {
                    "title": r["document_title"],
                    "page": r.get("page_number"),
                    "score": round(r["score"], 3),
                    "text_preview": r["text"][:200],
                }
                if federated:
                    source_entry["department_id"] = r.get("department_id", "")
                    source_entry["department_name"] = r.get("department_name", "")
                sources.append(source_entry)
            yield {"event": "sources", "data": json.dumps(sources)}

            # 7. Generate follow-up suggestions
            suggestions = self._generate_suggestions(question, full_text)
            yield {"event": "suggestions", "data": json.dumps(suggestions)}

            # 8. Calculate confidence
            avg_score = (
                sum(r["score"] for r in results) / len(results) if results else 0
            )
            confidence = min(round(avg_score * 100, 1), 100)
            yield {
                "event": "done",
                "data": json.dumps(
                    {
                        "confidence": confidence,
                        "federated": federated,
                        "departments_searched": len(
                            set(r.get("department_id", "") for r in results)
                        ),
                    }
                ),
            }

        except Exception as e:
            yield {"event": "error", "data": json.dumps({"error": str(e)})}

    def _generate_suggestions(self, question: str, answer: str) -> list[str]:
        suggestions = []
        if len(answer) > 200:
            suggestions.append("Can you summarize that in bullet points?")
        suggestions.append("Tell me more about this topic")
        suggestions.append("What related documents do you have?")
        return suggestions[:3]


# Singleton
rag_engine = RAGEngine()
