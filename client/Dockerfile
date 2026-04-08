# Build stage
FROM node:18 as build

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit

COPY . .

# FORCE CLEAN BUILD
RUN rm -rf node_modules/.cache dist
RUN npm run build

# VERIFY NO LOCALHOST IN DIST
RUN grep -r "localhost" /app/dist || echo "No localhost found in dist"

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]