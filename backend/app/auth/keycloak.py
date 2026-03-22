import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config import settings

KEYCLOAK_CERTS_URL = (
    f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}"
    "/protocol/openid-connect/certs"
)


async def get_jwks() -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(KEYCLOAK_CERTS_URL)
        resp.raise_for_status()
        return resp.json()


async def verify_token(token: str) -> dict:
    """Validate a Keycloak-issued JWT and return the payload."""
    try:
        keys = await get_jwks()
        payload = jwt.decode(
            token,
            keys,
            algorithms=["RS256"],
            audience=settings.KEYCLOAK_CLIENT_ID,
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
