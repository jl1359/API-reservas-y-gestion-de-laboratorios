#!/bin/sh
set -e

echo "=== INICIANDO CONTENEDOR BACKEND LABRESERVE ==="

echo "1. Aplicando migraciones de base de datos..."
npx prisma migrate deploy

echo "2. Aplicando restriccion matematica de concurrencia (btree_gist)..."
npx tsx prisma/apply_concurrency_constraint.ts || echo "Aviso: La restriccion ya estaba presente o se aplicara con el seed."

echo "3. Verificando datos iniciales (seed)..."
npx prisma db seed || echo "Aviso: Seed ya ejecutado o datos existentes."

echo "4. Iniciando servidor Express en puerto ${PORT:-3000}..."
exec node dist/server.js
