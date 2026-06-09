#!/usr/bin/env bash
# Подготовка ~/.ssh/deploy_key для GitHub Actions (DEPLOY_SSH_KEY или DEPLOY_SSH_KEY_B64).
set -euo pipefail

python3 <<'PY'
import base64
import os
import subprocess
from pathlib import Path

raw = os.environ.get("DEPLOY_SSH_KEY", "").strip()
b64 = os.environ.get("DEPLOY_SSH_KEY_B64", "").strip()
key_path = Path.home() / ".ssh" / "deploy_key"
key_path.parent.mkdir(mode=0o700, exist_ok=True)

def validate(path: Path) -> None:
    path.chmod(0o600)
    subprocess.run(
        ["ssh-keygen", "-y", "-f", str(path)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

if b64:
    if b64.startswith("ssh-"):
        raise SystemExit(
            "DEPLOY_SSH_KEY_B64 содержит публичный ключ. "
            "Нужен private: base64 -i ~/.ssh/aurent-deploy | tr -d '[:space:]' | pbcopy"
        )
    data = base64.b64decode("".join(b64.split()), validate=True)
    key_path.write_bytes(data)
    validate(key_path)
elif raw and "BEGIN" in raw:
    text = raw.replace("\r\n", "\n").replace("\r", "\n")
    if not text.endswith("\n"):
        text += "\n"
    key_path.write_text(text, encoding="utf-8")
    validate(key_path)
else:
    raise SystemExit(
        "Нет DEPLOY_SSH_KEY / DEPLOY_SSH_KEY_B64. "
        "Создайте secret DEPLOY_SSH_KEY_B64 в GitHub."
    )

fp = subprocess.check_output(["ssh-keygen", "-l", "-f", str(key_path)], text=True)
print("SSH key OK:", fp.split()[1] if fp else fp)
PY
