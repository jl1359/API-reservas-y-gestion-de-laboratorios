FROM node:20-alpine

WORKDIR /app

# Instalar openssl necesario para el motor binario de Prisma en Alpine Linux
RUN apk add --no-cache openssl

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar esquema Prisma y generar cliente
COPY prisma ./prisma
RUN npx prisma generate

# Copiar codigo fuente y compilar TypeScript
COPY . .
RUN npm run build

# Permisos de ejecucion para entrypoint
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
