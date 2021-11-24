import { Client, Collection, Intents, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
import { readdir } from 'fs';
import { Command } from './models/Command';
import { SteamApps } from './models/steam-apps/GetAppListResponse';
import * as fs from 'fs';

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
env.config();

export const MAXLENGTH = 5000;
export const chID = "870509503475486740";

let messageList: { [gameId: string]: string } = {};
let currentDate = new Date();
export const prefix = '!';
export const subscriptionList = 'subscriptionList.txt';
let steamAppList: SteamApps;

client.on('ready', async () => {
    const appList = await axios.get('http://api.steampowered.com/ISteamApps/GetAppList/v0002/');

    if (appList.status === 200) {
        console.log(`Retrieved SteamApp response`);
        steamAppList = appList.data as SteamApps;
    } else {
        console.error(`${appList.status}: Unable to retrieve response \n ${appList.data}`);
    }
});

client.once("shardReconnecting", id => {
    console.log(`Shard with ID ${id} reconnected`);
});

client.once("shardDisconnect", (event, shardID) => {
    console.log(`Disconnected from event ${event} with ID ${shardID}`);
});

const commands = new Collection();
readdir('dist/commands', (err, allFiles) => {
    if (err) {
        console.error(`Unable to load commands: ${err}`);
    }
    let files = allFiles.filter(f => f.split('.').pop() === ('js'));
    if (files.length <= 0) {
        console.log(`No commands found!`);
        return;
    }
    for (const file of files) {
        const command = require(`./commands/${file}`) as {
            name: string, command: Command
        };
        commands.set(command.name, command);
    }

});

client.on('message', async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) {
        return;
    }
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    if (args.length < 1) {
        return;
    }
    const command = args.shift()!.toLowerCase();
    const commandFile = commands.get(command) as Command;
    if (!commandFile) {
        return;
    }
    if (commands.size < 1) {
        return;
    }

    commandFile.execute({
        msg: message,
        args: args,
        commands: commands,
        appList: steamAppList
    });

});

cron.schedule('*/1 * * * *', async () => {

    const channel = await client.channels.fetch(chID) as TextChannel;
    let time = currentDate.getHours() + ":" + currentDate.getMinutes();
    console.log(`Making request at: ${time}`);

    const rl = fs.createReadStream(subscriptionList, {
        flags: 'a+',
        encoding: 'utf8'
    });
    rl.on('error', (err) => { console.error(err); });
    rl.on('data', async (line) => {
        const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${line}&count=1&maxlength=${MAXLENGTH}&format=json`
        const req = await axios.get(url);

        if (req.status === 200) {
            const data = req.data as News;
            console.log(data);
            sendGameNews(data, channel);
        } else {
            console.log(req.status);
        }

    });

});


function sendGameNews(response: News, channel: TextChannel) {
    if (!response) {
        return;
    }
    const message = response.appnews.newsitems[0].url;

    if ((messageList[response.appnews.appid] === null)) {
        messageList[response.appnews.appid] = message;
        channel.send(response.appnews.newsitems[0].url);
        return;
    }

    if (messageList[response.appnews.appid] !== message) {
        messageList[response.appnews.appid] = message;
        channel.send(message);
    }
}


client.login(process.env.DISCORD_TOKEN);