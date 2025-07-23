# Usar una imagen base con Node.js
FROM node:22-alpine

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json del frontend (raíz)
COPY package*.json ./

# Instalar dependencias del frontend
RUN npm install

# Copiar package.json del backend
COPY backend/package*.json ./backend/

# Instalar dependencias del backend
RUN cd backend && npm install

# Copiar todo el código fuente
COPY . .

# Exponer puertos
# 4200 para Angular (ng serve por defecto)
# 5000 para Node.js (ajusta según tu configuración)
EXPOSE 4200 5000

RUN chmod +x start.sh

# Comando por defecto
CMD ["./start.sh"]
