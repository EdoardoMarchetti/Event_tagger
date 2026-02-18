FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Use dev mode for development (when volumes are mounted)
# For production, uncomment the build step and use "npm start"
CMD ["npm", "run", "dev"]
