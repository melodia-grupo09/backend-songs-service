# ---- Base Stage ----
FROM node:22 AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies Stage ----
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

ENV DD_API_KEY=${DD_API_KEY}
ENV DD_SITE="datadoghq.com"
ENV DD_REMOTE_UPDATES=true

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/* && \
    bash -c "$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)"

# Copy dependencies
COPY --from=build /app/node_modules ./node_modules

# Copy the built application from the 'build' stage.
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]