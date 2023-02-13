import { Client, Collection, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
import { SteamApps } from './models/steam-apps/GetAppListResponse';
import * as fs from 'fs';
import { ImportCommand } from './models/ImportCommand';
import deployCommand from './deploy-command';
import { MessageList, Msg } from './models/Messages';
import { Subscriptions } from './models/Subscriptions';

env.config();
export const MAXLENGTH = 1;
export const chID = process.env.CHID;


deployCommand.deploy();

const commands = new Collection<string, ImportCommand>();
const files = fs.readdirSync('dist/commands').filter(file => file.endsWith('.js'));
for (const file of files) {
    const command = require(`./commands/${file}`) as ImportCommand;
    console.log(`setting command: ${command.data.name}`);
    commands.set(command.data.name, command);

}

const client = new Client({
    intents: [],
});

export const subscriptionListFile = 'subscriptionList.json';
const messages = 'messageHistory.json';
export let steamAppList: SteamApps;

client.once('ready', async () => {
    const appList = await axios.get('http://api.steampowered.com/ISteamApps/GetAppList/v0002/');

    if (appList.status === 200) {
        steamAppList = appList.data as SteamApps;
        console.log(`Retrieved SteamApp response`);
    } else {
        console.error(`${appList.status}: Unable to retrieve response \n ${appList.data}`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
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


    fs.readFile(subscriptionListFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data.length > 0) {
            let subscriptions = JSON.parse(data) as Subscriptions;
            if (subscriptions.gameList.length > 0) {
                for (const game of subscriptions.gameList) {
                    const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${game.gameID}&count=1&maxlength=${MAXLENGTH}&format=json`;
                    axios.get(url).then((r) => {
                        if (r.status === 200) {
                            const resp = r.data as News;
                            sendGameNews(resp, channel);
                        } else {
                            console.log(r.status);
                        }
                    });

                }
            }
        }

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
            processMsg(msgList, data, message, channel)

        }
    });
}

function processMsg(msgList: MessageList, data: string, message: Msg, channel: TextChannel) {
    if (data.length > 0) {
        let msg = JSON.parse(data) as MessageList;
        const found = msg.messages.find(x => x.url === message.url);
        if (found) {
            return;
        } else {
            msg.messages.push(message);
            fs.writeFile(messages, JSON.stringify(msg, null, 4), (error) => {
                if (error) {
                    console.error(error);
                }
            });
            channel.send(message.url);
        }
    } else {
        msgList.messages.push(message);
        fs.writeFile(messages, JSON.stringify(msgList, null, 4), (er) => { if (er) { console.error(er); } });
        channel.send(message.url);
    }
}


client.login(process.env.DISCORD_TOKEN);