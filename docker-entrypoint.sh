#!/bin/bash
echo "Iniciando Datadog Agent..."
/opt/datadog-agent/bin/agent/agent run &
sleep 5
exec "$@"