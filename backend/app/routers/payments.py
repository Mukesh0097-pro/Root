from datetime import datetime

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..config import settings
from ..models.db import User
from ..auth.dependencies import get_current_user
from ..services.audit import log_action

router = APIRouter()

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Price IDs will be set after creating products in Stripe
# These are placeholders — we'll create them via API on first run
PLAN_CONFIG = {
    "free": {
        "name": "Free",
        "price_monthly": 0,
        "queries_per_day": settings.FREE_QUERIES_PER_DAY,
        "max_documents": settings.FREE_MAX_DOCUMENTS,
        "features": [
            f"{settings.FREE_QUERIES_PER_DAY} AI queries per day",
            f"{settings.FREE_MAX_DOCUMENTS} documents",
            "Single department",
            "Basic chat history",
        ],
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 900,  # $9.00 in cents
        "queries_per_day": settings.PRO_QUERIES_PER_DAY,
        "max_documents": settings.PRO_MAX_DOCUMENTS,
        "features": [
            "Unlimited AI queries",
            f"{settings.PRO_MAX_DOCUMENTS} documents",
            "Federated cross-department search",
            "Priority responses",
            "Advanced analytics",
        ],
    },
    "business": {
        "name": "Business",
        "price_monthly": 2900,  # $29.00 in cents
        "queries_per_day": 99999,
        "max_documents": 99999,
        "features": [
            "Everything in Pro",
            "Unlimited documents",
            "5 team members included",
            "Admin dashboard",
            "API access",
            "Priority support",
        ],
    },
}


# --- Schemas ---

class CreateCheckoutRequest(BaseModel):
    plan: str  # "pro" or "business"
    billing_period: str = "monthly"  # "monthly" or "yearly"


class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    queries_today: int
    queries_limit: int
    documents_used: int
    documents_limit: int
    current_period_end: Optional[str] = None
    cancel_at_period_end: bool = False


class PlanResponse(BaseModel):
    id: str
    name: str
    price_monthly: int
    features: list[str]
    is_current: bool = False


# --- Helper: ensure Stripe products exist ---

async def get_or_create_stripe_price(plan_id: str, interval: str = "month") -> str:
    """Get or create a Stripe Price for a plan."""
    if plan_id == "free":
        return ""

    config = PLAN_CONFIG[plan_id]
    amount = config["price_monthly"]

    # For yearly, give 20% discount
    if interval == "year":
        amount = int(amount * 12 * 0.8)  # 20% off yearly

    # Search for existing product
    products = stripe.Product.list(limit=10)
    product = None
    for p in products.data:
        if p.metadata.get("plan_id") == plan_id:
            product = p
            break

    if not product:
        product = stripe.Product.create(
            name=f"FedKnowledge {config['name']}",
            metadata={"plan_id": plan_id},
        )

    # Search for matching price
    prices = stripe.Price.list(product=product.id, active=True, limit=10)
    for price in prices.data:
        if price.unit_amount == amount and price.recurring.interval == interval:
            return price.id

    # Create new price
    price = stripe.Price.create(
        product=product.id,
        unit_amount=amount,
        currency="usd",
        recurring={"interval": interval},
    )
    return price.id


# --- Routes ---

@router.get("/plans", response_model=list[PlanResponse])
async def list_plans(current_user: User = Depends(get_current_user)):
    """List all available plans."""
    plans = []
    for plan_id, config in PLAN_CONFIG.items():
        plans.append(PlanResponse(
            id=plan_id,
            name=config["name"],
            price_monthly=config["price_monthly"],
            features=config["features"],
            is_current=(current_user.plan == plan_id),
        ))
    return plans


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's subscription status."""
    plan = current_user.plan or "free"
    config = PLAN_CONFIG.get(plan, PLAN_CONFIG["free"])

    # Count user's documents
    from ..models.db import Document
    doc_result = await db.execute(
        select(Document).where(Document.uploaded_by == current_user.id)
    )
    doc_count = len(doc_result.scalars().all())

    # Reset daily queries if needed
    today = datetime.utcnow().date()
    if current_user.queries_reset_date is None or current_user.queries_reset_date.date() < today:
        current_user.queries_today = 0
        current_user.queries_reset_date = datetime.utcnow()
        await db.commit()

    response = SubscriptionResponse(
        plan=plan,
        status="active",
        queries_today=current_user.queries_today or 0,
        queries_limit=config["queries_per_day"],
        documents_used=doc_count,
        documents_limit=config["max_documents"],
    )

    # Get Stripe subscription details if exists
    if current_user.stripe_subscription_id and settings.STRIPE_SECRET_KEY:
        try:
            sub = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
            response.status = sub.status
            response.current_period_end = datetime.fromtimestamp(
                sub.current_period_end
            ).isoformat()
            response.cancel_at_period_end = sub.cancel_at_period_end
        except Exception:
            pass

    return response


@router.post("/create-checkout")
async def create_checkout_session(
    req: CreateCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout Session for upgrading."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Stripe payments are not configured on this server. Please set STRIPE_SECRET_KEY in your environment."
        )

    if req.plan not in ["pro", "business"]:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if current_user.plan == req.plan:
        raise HTTPException(status_code=400, detail="Already on this plan")

    # Get or create Stripe customer
    if not current_user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=f"{current_user.first_name} {current_user.last_name}",
            metadata={"user_id": str(current_user.id)},
        )
        current_user.stripe_customer_id = customer.id
        await db.commit()

    # Get the price ID
    interval = "year" if req.billing_period == "yearly" else "month"
    price_id = await get_or_create_stripe_price(req.plan, interval)

    # Determine success/cancel URLs
    frontend_url = settings.stripe_frontend_url

    session = stripe.checkout.Session.create(
        customer=current_user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{frontend_url}/app/billing?success=true",
        cancel_url=f"{frontend_url}/app/billing?canceled=true",
        metadata={
            "user_id": str(current_user.id),
            "plan": req.plan,
        },
    )

    await log_action(
        db, current_user.id, current_user.department_id,
        "checkout_started", "subscription", req.plan,
    )

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/create-portal")
async def create_portal_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Customer Portal session for managing subscription."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured on this server."
        )

    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")

    frontend_url = settings.stripe_frontend_url

    try:
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{frontend_url}/app/billing",
        )
        return {"portal_url": session.url}
    except stripe.error.InvalidRequestError as e:
        # Usually means the Customer Portal is not configured in Stripe dashboard
        raise HTTPException(
            status_code=503,
            detail=(
                "The Stripe Customer Portal is not configured. "
                "Please enable it at: https://dashboard.stripe.com/settings/billing/portal"
            )
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e.user_message or e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if settings.STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        else:
            # For testing without webhook secret
            import json
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Handle the event
    if event.type == "checkout.session.completed":
        session = event.data.object
        user_id = session.metadata.get("user_id")
        plan = session.metadata.get("plan")
        subscription_id = session.subscription

        if user_id and plan:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                user.plan = plan
                user.stripe_subscription_id = subscription_id
                user.stripe_customer_id = session.customer
                await db.commit()

    elif event.type == "customer.subscription.updated":
        subscription = event.data.object
        customer_id = subscription.customer

        result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = result.scalar_one_or_none()
        if user:
            if subscription.status == "active":
                # Update plan based on price
                plan = subscription.metadata.get("plan", user.plan)
                user.plan = plan
            elif subscription.status in ("canceled", "unpaid", "past_due"):
                user.plan = "free"
                user.stripe_subscription_id = None
            await db.commit()

    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        customer_id = subscription.customer

        result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = result.scalar_one_or_none()
        if user:
            user.plan = "free"
            user.stripe_subscription_id = None
            await db.commit()

    return {"received": True}


@router.get("/config")
async def get_stripe_config():
    """Return Stripe publishable key for frontend."""
    return {
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        "plans": {
            plan_id: {
                "name": config["name"],
                "price_monthly": config["price_monthly"],
                "features": config["features"],
            }
            for plan_id, config in PLAN_CONFIG.items()
        },
    }
