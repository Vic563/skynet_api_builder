#!/bin/bash
# Sync local codebase to remote server
# Usage: ./sync-to-server.sh

SERVER="victor@10.58.108.24"
REMOTE_PATH="~/"
LOCAL_PATH="/Users/DT232381/code/skynet_api_builder_with_workflows"
PASSWORD="Nyc4u2me"

echo "Syncing to $SERVER..."
sshpass -p "$PASSWORD" rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  -e 'ssh -o StrictHostKeyChecking=no' \
  "$LOCAL_PATH" "$SERVER:$REMOTE_PATH"

echo "Done! Restart dev server on remote if needed."
