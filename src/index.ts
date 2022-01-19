import { Client, Collection, Intents, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
import { SteamApps } from './models/steam-apps/GetAppListResponse';
import * as fs from 'fs';
import { ImportCommand } from './models/ImportCommand';
import deployCommand from './deploy-command';

env.config();
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
export const MAXLENGTH = 1;
export const chID = process.env.CHID;


deployCommand.deploy();

const commands = new Collection<string, ImportCommand>();
const files = fs.readdirSync('dist/commands').filter(file => file.endsWith('.js'));
for (const file of files) {
    const command = require(`./commands/${file}`) as ImportCommand;
    commands.set(command.data.name, command);

}


let messageList: { [gameId: string]: string } = {};
export const subscriptionList = 'subscriptionList.txt';
export let steamAppList: SteamApps;

client.once('ready', async () => {
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

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const cmd = commands.get(interaction.commandName);
    if (!cmd) return;
    try {
        await cmd.execute(interaction);
    } catch (error) {
        console.error(error);
    }
});

cron.schedule('*/20 * * * *', async () => {

    const channel = await client.channels.fetch(chID) as TextChannel;
    let currentDate = new Date();
    let time = currentDate.getHours() + ":" + currentDate.getMinutes();
    console.log(`Making request at: ${time}`);

    const rl = fs.createReadStream(subscriptionList, {
        flags: 'a+',
        encoding: 'utf8'
    });
    rl.on('error', (err) => { console.error(err); });
    rl.on('data', async (line) => {
        line.toString().split(',').forEach(i => {
            if (i !== '') {
                const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${i}&count=1&maxlength=${MAXLENGTH}&format=json`;
                console.log(url);
                axios.get(url).then((data) => {
                    if (data.status === 200) {
                        const resp = data.data as News;
                        sendGameNews(resp, channel);
                    } else {
                        console.log(data.status);
                    }
                });
            }
        });
        rl.close(() => {
            console.log('Closed stream');
        })

    });

});


function sendGameNews(response: News, channel: TextChannel) {
    if (!response) {
        return;
    }
    if (response.appnews.newsitems[0].feedlabel !== 'Community Announcements') return;

    const message = response.appnews.newsitems[0].url;

    if ((messageList[response.appnews.appid] === null)) {
        messageList[response.appnews.appid] = message;
        channel.send(message);
        return;
    }

    if (messageList[response.appnews.appid] !== message) {
        messageList[response.appnews.appid] = message;
        channel.send(message);
    }
}


client.login(process.env.DISCORD_TOKEN);