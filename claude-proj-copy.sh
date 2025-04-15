#
#!/bin/bash

# Create target directory if it doesn't exist
mkdir -p ../readpz2

# Create necessary subdirectories
mkdir -p ../readpz2/gmail-gcpWebhook
mkdir -p ../readpz2/server-agent
mkdir -p ../readpz2/touch-user
mkdir -p ../readpz2/client-agent
mkdir -p ../readpz2/hello-graph/agent
mkdir -p ../readpz2/admin-agent

# Copy the key files mentioned in the document
# Gmail to GCP webhook
cp ./gmail-gcpWebhook/processEmails.js ../readpz2/gmail-gcpWebhook/

# Server agent files
cp ./server-agent/index.js ../readpz2/server-agent/

# Touch user email functionality
cp ./touch-user/index.ts ../readpz2/touch-user/

# Client web application files
cp ./client-agent/client/index.html ../readpz2/client-agent/client/

# LangGraph workflow agent
cp ./hello-graph/agent/workflow.py ../readpz2/hello-graph/agent/

# Copy any admin agent files (marked as "no code yet" but creating directory for future)
# This is empty based on document but creating directory for completeness
touch ../readpz2/admin-agent/README.md
echo "# Admin Agent\nNo code yet. Will be a GCP function called via cron." > ../readpz2/admin-agent/README.md

echo "Key Prizm files have been copied to ../readpz2/"