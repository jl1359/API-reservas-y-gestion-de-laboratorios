# Etapa 1: Compilacion de React con Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Dejar VITE_API_URL vacio para que las llamadas apunten al proxy relativo /api de Nginx
ENV VITE_API_URL=""
RUN npm run build

# Etapa 2: Servidor web ultraligero con Nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
