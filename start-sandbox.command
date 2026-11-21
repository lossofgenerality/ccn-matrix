#!/bin/bash
# Double-click to start the CCN Matrix sandbox (needs Docker Desktop running).
# © Computational Classnotes · CC BY-NC-SA 4.0
cd "$(dirname "$0")/sandbox" || exit 1
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker isn't installed. Get Docker Desktop from https://www.docker.com/products/docker-desktop/ then double-click this again."
  read -n 1 -s -r -p "Press any key to close."; exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Starting Docker Desktop..."; open -a Docker
  until docker info >/dev/null 2>&1; do sleep 2; done
fi
[ -f .env ] || { echo "Missing sandbox/.env — copy .env.example to .env and fill it in."; read -n 1 -s -r; exit 1; }
docker compose up -d --build || { read -n 1 -s -r -p "Something failed above. Press any key to close."; exit 1; }
echo "Waiting for the chat app..."
until curl -s -o /dev/null http://localhost:8080; do sleep 2; done
echo
echo "Ready. Create your account at http://localhost:8080"
echo "  Username:           $(grep '^SANDBOX_INVITE=' .env | cut -d= -f2 | cut -d, -f1 | sed 's/^@//; s/:.*//')"
echo "  Registration token: $(grep '^REGISTRATION_TOKEN=' .env | cut -d= -f2)"
open http://localhost:8080
read -n 1 -s -r -p "Press any key to close this window (the sandbox keeps running)."
