import json
import uuid as uuid_mod
import time
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from ..database import get_db
from ..models.db import User, Conversation, ChatMessage
from ..models.schemas import (
    ChatRequest, ChatMessageResponse, ConversationResponse, ConversationRenameRequest, FeedbackRequest,
)
from ..auth.dependencies import get_current_user
from ..services.rag_engine import rag_engine
from ..services.audit import log_action

router = APIRouter()


@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Create or get conversation
    conversation_id = req.conversation_id
    if conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            user_id=current_user.id,
            department_id=req.department_id,
            title=req.message[:80] if len(req.message) > 0 else "New Conversation",
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation_id = conversation.id

    # Save user message
    user_msg = ChatMessage(
        conversation_id=conversation_id,
        role="user",
        content=req.message,
    )
    db.add(user_msg)
    await db.commit()

    # Load conversation history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at)
    )
    history_msgs = history_result.scalars().all()
    conversation_history = [
        {"role": m.role, "content": m.content} for m in history_msgs
    ]

    dept_id = str(req.department_id)

    async def event_generator():
        full_response = ""
        sources_data = []
        confidence_val = 0.0
        start_time = time.time()

        async for event in rag_engine.query_stream(
            question=req.message,
            department_id=dept_id,
            conversation_history=conversation_history,
            federated=req.federated,
        ):
            evt = event.get("event", "content")
            data = event.get("data", "")

            if evt == "content":
                parsed = json.loads(data)
                full_response += parsed.get("text", "")
            elif evt == "sources":
                sources_data = json.loads(data)
            elif evt == "done":
                done_data = json.loads(data)
                confidence_val = done_data.get("confidence", 0)

            yield {"event": evt, "data": data}

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Save assistant message to DB
        assistant_msg = ChatMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
            sources_json=json.dumps(sources_data),
            confidence=confidence_val,
            response_time_ms=elapsed_ms,
        )
        db.add(assistant_msg)

        # Update conversation timestamp
        conversation.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(assistant_msg)

        # Send final message_id
        yield {
            "event": "message_complete",
            "data": json.dumps({
                "message_id": str(assistant_msg.id),
                "conversation_id": str(conversation_id),
            }),
        }

        await log_action(
            db, current_user.id, req.department_id,
            "chat_query", "conversation", str(conversation_id),
            details={"query": req.message[:200]},
        )

    return EventSourceResponse(event_generator())


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    department_id: Optional[uuid_mod.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Conversation).where(Conversation.user_id == current_user.id)
    if department_id:
        query = query.where(Conversation.department_id == department_id)
    query = query.order_by(desc(Conversation.updated_at))

    result = await db.execute(query)
    conversations = result.scalars().all()

    # Get message counts
    response = []
    for conv in conversations:
        count_result = await db.execute(
            select(func.count()).select_from(ChatMessage).where(ChatMessage.conversation_id == conv.id)
        )
        msg_count = count_result.scalar() or 0
        response.append(ConversationResponse(
            id=conv.id,
            title=conv.title,
            department_id=conv.department_id,
            is_starred=conv.is_starred,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=msg_count,
        ))

    return response


@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(
    conversation_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify conversation ownership
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    return [
        ChatMessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            sources=json.loads(m.sources_json) if m.sources_json else [],
            confidence=m.confidence,
            feedback=m.feedback,
            feedback_details=m.feedback_details,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.patch("/conversations/{conversation_id}")
async def rename_conversation(
    conversation_id: uuid_mod.UUID,
    req: ConversationRenameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.title = req.title
    await db.commit()
    return {"status": "ok"}


@router.patch("/conversations/{conversation_id}/star")
async def star_conversation(
    conversation_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.is_starred = not conversation.is_starred
    await db.commit()
    return {"status": "ok", "is_starred": conversation.is_starred}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: uuid_mod.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete messages first
    msgs = await db.execute(
        select(ChatMessage).where(ChatMessage.conversation_id == conversation_id)
    )
    for msg in msgs.scalars().all():
        await db.delete(msg)

    await db.delete(conversation)
    await db.commit()
    return {"status": "ok"}


@router.post("/chat/messages/{message_id}/feedback")
async def submit_feedback(
    message_id: uuid_mod.UUID,
    req: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ChatMessage).where(ChatMessage.id == message_id))
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if req.feedback not in ("up", "down"):
        raise HTTPException(status_code=400, detail="Feedback must be 'up' or 'down'")

    message.feedback = req.feedback
    message.feedback_details = req.details
    await db.commit()

    await log_action(
        db, current_user.id, None,
        "feedback", "chat_message", str(message_id),
        details={"feedback": req.feedback},
    )

    return {"status": "ok"}
