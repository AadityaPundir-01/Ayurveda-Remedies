from app.routers.health import router as health_router
from app.routers.admin import router as admin_router
from app.routers.consult import router as consult_router

__all__ = ["health_router", "admin_router", "consult_router"]
