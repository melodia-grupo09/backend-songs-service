#!/bin/bash
echo "Iniciando Datadog Agent..."

service datadog-agent start

sleep 5
node dist/src/main