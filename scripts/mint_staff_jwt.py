import base64
import hashlib
import hmac
import json
import pathlib
import time


def b64url(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def load_env(path: pathlib.Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        env[key.strip()] = value
    return env


if __name__ == "__main__":
    import os
    env = load_env(pathlib.Path(__file__).resolve().parents[1] / "backend" / ".vercel" / ".env.production.local")
    secret = env.get("SUPABASE_JWT_SECRET") or os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise SystemExit("Missing SUPABASE_JWT_SECRET")

    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "aud": "authenticated",
        "role": "staff",
        "email": "staff@afda.local",
        "user_email": "staff@afda.local",
        "given_name": "Staff",
        "family_name": "User",
        "app_metadata": {"role": "staff"},
        "sub": "00000000-0000-4000-8000-000000000001",
        "iss": "supabase",
        "iat": now,
        "exp": now + 86400,
    }

    signing_input = b".".join(
        [
            b64url(json.dumps(header, separators=(",", ":")).encode()),
            b64url(json.dumps(payload, separators=(",", ":")).encode()),
        ]
    )
    signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    token = b".".join([signing_input, b64url(signature)]).decode()
    print(token)
