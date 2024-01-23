FROM node:20-alpine
WORKDIR /app

# Install DCMTK
RUN apk add --no-cache dcmtk --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/

# Copy source code
COPY . .

# Install dependencies
RUN npm ci --ignore-scripts --omit=dev

CMD ["npm", "start"]
