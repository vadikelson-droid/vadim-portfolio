"""Upload photographer site files to VPS"""
import paramiko
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / "poster-telegram-bot" / ".env")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(
    os.getenv("VPS_IP"),
    username=os.getenv("VPS_USER"),
    pkey=paramiko.Ed25519Key.from_private_key_file(os.getenv("SSH_KEY_PATH")),
    timeout=30
)

sftp = ssh.open_sftp()
local_dir = Path(__file__).resolve().parent
remote_dir = "/var/www/default/photographer"

# Files to upload (relative paths)
files_to_upload = [
    "index.html",
    "css/style.css",
    "js/app.js",
]

for rel_path in files_to_upload:
    local_path = local_dir / rel_path
    remote_path = f"{remote_dir}/{rel_path}"
    if local_path.exists():
        print(f"  {rel_path} -> {remote_path}")
        sftp.put(str(local_path), remote_path)
    else:
        print(f"  SKIP {rel_path} (not found)")

sftp.close()
ssh.close()
print("Done!")
