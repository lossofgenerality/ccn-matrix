#!/bin/bash
# Double-click to stop the CCN Matrix sandbox. Your chats are kept in sandbox/data/.
cd "$(dirname "$0")/sandbox" && docker compose down
read -n 1 -s -r -p "Stopped. Press any key to close."
