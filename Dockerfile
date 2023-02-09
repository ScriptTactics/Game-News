FROM node:alpine

# Create directory
WORKDIR /usr/Game-News

# Copy and install bot
COPY package.json .
RUN npm install\
        && npm install typescript -g

# Copy Bot
COPY . .
RUN tsc


# Start
CMD ["node", "./dist/index.js"]
