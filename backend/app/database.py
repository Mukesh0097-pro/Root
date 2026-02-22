import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from .config import settings

# Configure connection args for Supabase
connect_args = {}
engine_kwargs = {}
if "supabase" in settings.DATABASE_URL or "pooler" in settings.DATABASE_URL:
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_context
    # Required for Supabase connection pooler (pgBouncer)
    connect_args["statement_cache_size"] = 0
    # Connection timeout (seconds)
    connect_args["timeout"] = 60
    # Use NullPool since pgBouncer handles pooling
    engine_kwargs["poolclass"] = NullPool

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    **engine_kwargs,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
