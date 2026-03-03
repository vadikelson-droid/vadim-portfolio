"""Upload Infinity Beauty demo to VPS"""
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
remote_dir = "/var/www/default/infinity-beauty"

# Create remote dirs
for cmd in [f"mkdir -p {remote_dir}/img"]:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdout.channel.recv_exit_status()

# Upload HTML
for f in ["index.html"]:
    local_path = local_dir / f
    if local_path.exists():
        print(f"  {f} -> {remote_dir}/{f}")
        sftp.put(str(local_path), f"{remote_dir}/{f}")

# Upload images
img_dir = local_dir / "img"
for f in sorted(img_dir.iterdir()):
    if f.suffix in ('.jpg', '.jpeg', '.png', '.webp'):
        remote_path = f"{remote_dir}/img/{f.name}"
        print(f"  img/{f.name} -> {remote_path}")
        sftp.put(str(f), remote_path)

sftp.close()
ssh.close()
print("Done!")
