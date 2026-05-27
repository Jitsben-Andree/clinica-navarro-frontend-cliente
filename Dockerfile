# =========================
# ETAPA 1: BUILD ANGULAR
# =========================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build -- --configuration production



# ETAPA 2: NGINX
FROM nginx:1.25-alpine

# Limpiamos contenido default de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos build Angular
COPY --from=build /app/dist/clinica-navarro-frontend-cliente/browser /usr/share/nginx/html

# Angular 20 genera index.csr.html
# Lo renombramos a index.html para nginx
RUN mv /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html

# Configuración SPA Angular
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]