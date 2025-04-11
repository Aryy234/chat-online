FROM node:20.12-alpine3.19

# Añadir etiquetas
LABEL maintainer="MecanografyGame"
LABEL version="1.0"
LABEL description="Juego de mecanografía multijugador"

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json del servidor 
COPY server/package*.json ./

# Instalar solo las dependencias de producción
RUN npm ci --omit=dev

# Copiar el código del servidor compilado
COPY server/dist ./dist

# Copiar los archivos estáticos del cliente
COPY dist ./public

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Puerto que expondrá la aplicación
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "dist/index.js"]