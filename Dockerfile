FROM node:alpine

# Create directory
WORKDIR /usr/game-news

# Copy and install bot
COPY package.json .
RUN touch subscriptionList.json
RUN touch messageHistory.json
RUN npm install && npm install typescript -g

# Copy Bot
COPY . .
RUN tsc

# Start
CMD ["node", "./dist/index.js"]
