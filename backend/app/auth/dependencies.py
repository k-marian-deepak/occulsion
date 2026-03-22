from fastapi import Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.keycloak import verify_token

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> dict:
    """FastAPI dependency — returns Keycloak token payload."""
    return await verify_token(creds.credentials)


async def require_role(*roles: str):
    """Return a dependency that enforces one of the given Keycloak realm roles."""
    async def _check(user: dict = Depends(get_current_user)) -> dict:
        user_roles: list[str] = (
            user.get("realm_access", {}).get("roles", [])
        )
        if not any(r in user_roles for r in roles):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {roles}",
            )
        return user
    return _check
