from fastapi import Header, HTTPException, status
from app.core.config import settings

async def require_api_key(x_api_key: str | None = Header(default=None)):
    # In local demo mode, no API key is required unless configured.
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "invalid_api_key", "message": "A valid X-API-Key header is required."})
    return True

def require_roles(*allowed_roles: str):
    async def dependency(role: str = Header(default="farmer", alias="X-User-Role")):
        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail={"error": "forbidden", "message": "This role cannot access the requested resource."})
        return role
    return dependency
