FROM node:15-alpine AS builder
WORKDIR /app
ARG VERSION
ARG SHA

COPY package.json .
COPY package-lock.json .

RUN npm install 

# Add the remaining project files
COPY . .

RUN VERSION=$VERSION SHA=$SHA npm run build

###
FROM node:15-alpine
WORKDIR /app
COPY --from=builder /app/dist .
CMD node app.js
