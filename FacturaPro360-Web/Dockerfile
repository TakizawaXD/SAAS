# ETAPA 1: Construcción de la aplicación Angular (Multi-Stage Build)
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias primero para optimizar la caché de capas Docker
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copiar código fuente
COPY . .

# Compilar paquete optimizado para producción
RUN npm run build -- --configuration=production

# ETAPA 2: Servidor Web Nginx de Producción Ultra Ligero y Seguro
FROM nginx:alpine-slim AS production

LABEL maintainer="FacturaPro360 Team"
LABEL description="FacturaPro 360 - Edición Web Producción"

# Limpiar archivos de configuración por defecto
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copiar configuración hardened de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle compilado de Angular desde la etapa de construcción
COPY --from=build /app/dist/facturapro-web/browser /usr/share/nginx/html

# Permisos seguros de solo lectura en ejecución
RUN chmod -R 755 /usr/share/nginx/html

# Exponer puerto HTTP estándar
EXPOSE 80

# Comprobación periódica de salud del contenedor
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
