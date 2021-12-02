import { Client, Collection, Intents, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
import { SteamApps } from './models/steam-apps/GetAppListResponse';
import * as fs from 'fs';
import { ImportCommand } from './models/ImportCommand';
import deployCommand from './deploy-command';
import { MessageList, Msg } from './models/Messages';

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


export const subscriptionList = 'subscriptionList.txt';
const messages = 'messageHistory.json';
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
    const message = {
        gameId: response.appnews.appid,
        time: response.appnews.newsitems[0].date,
        url: response.appnews.newsitems[0].url
    } as Msg;

    if (!response) {
        return;
    }
    if (response.appnews.newsitems[0].feedlabel !== 'Community Announcements') return;

    fs.readFile(messages, 'utf8', (err, data) => {
        if (err) {
            console.error(`${err}: Unable to parse JSON`);
        } else {
            let msgList: MessageList = {
                messages: []
            };
            console.log(`Data Length: ${data.length} \n`);
            console.log(`Message Game Id: ${message.gameId}`)
            if (data.length > 0) {
                let msg = JSON.parse(data) as MessageList;
               const found =  msg.messages.find(x => x.url === message.url);
                if (found) {
                    return;
                } else {
                    msg.messages.push(message);
                    fs.writeFile(messages, JSON.stringify(msg, null, 4), (err) => {
                        if (err) {
                            console.error(err);
                        }
                    });
                    channel.send(message.url);
                }
            } else {
                msgList.messages.push(message);
                fs.writeFile(messages, JSON.stringify(msgList, null, 4), (err) => { if (err) { console.error(err); } });
                channel.send(message.url);
            }
        }
    });

}


client.login(process.env.DISCORD_TOKEN);