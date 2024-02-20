FROM node:20-alpine
WORKDIR /app

# Install DCMTK
RUN apk add --no-cache dcmtk --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/

# Copy package.json and package-lock.json early for caching
COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts --omit=dev

# Copy source code
COPY . .

ENTRYPOINT ["node", "./bin/www.js"]
