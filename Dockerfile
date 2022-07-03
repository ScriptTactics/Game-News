FROM node:latest

# Create directory
RUN mkdir =p /usr/src/game-news
WORKDIR /usr/src/game-news

# Copy and install bot
COPY package.json /usr/src/game-news
RUN npm install

# Copy Bot
COPY . /usr/src/game-news

# Start
CMD ["node", "/dist/index.js"]