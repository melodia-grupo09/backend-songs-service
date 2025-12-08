#!/bin/bash
echo "Starting Datadog Agent..."

datadog-agent run &

sleep 5
echo "Starting app..."
node dist/src/main