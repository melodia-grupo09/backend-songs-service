# ---- Base Stage ----
FROM node:22 AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies Stage ----
# (splitted to leverage docker's cache)
FROM base AS dependencies
RUN npm ci

# ---- Build Stage ----
FROM dependencies AS build
COPY . .
RUN npm run build
# Clean dev dependencies
RUN npm prune --omit=dev

# ---- Production Stage ----
FROM base AS production

# Declara el argumento que se recibirá durante la compilación
ARG APP_VERSION
# Establece la variable de entorno usando el valor del argumento
ENV APP_VERSION=${APP_VERSION}

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy dependencies
COPY --from=build /app/node_modules ./node_modules

# Copy the built application from the 'build' stage.
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]