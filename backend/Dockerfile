FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY src/scripts/quizData.json ./src/scripts/quizData.json

EXPOSE 5000

CMD ["node", "src/index.js"]
