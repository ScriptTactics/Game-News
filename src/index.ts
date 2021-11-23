import { Client, Collection, MessageEmbed, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
import { readdir } from 'fs';
import { Command } from './models/Command';
import { SteamApps } from './models/steam-apps/GetAppListResponse';
import * as fs from 'fs';

const client = new Client();
env.config();

export const MAXLENGTH = 5000;
export const chID = "870509503475486740";

let embedList: { [gameId: string]: MessageEmbed } = {};
let initEmbed = new MessageEmbed();
let currentDate = new Date();
const prefix = '!';
export const subscriptionList = 'subscriptionList.txt';
let steamAppList: SteamApps;

client.on('ready', async () => {
    let time = currentDate.getHours() + ":" + currentDate.getMinutes();
    const appList = await axios.get('http://api.steampowered.com/ISteamApps/GetAppList/v0002/');

    if (appList.status === 200) {
        console.log(`Retrieved SteamApp response`);
        steamAppList = appList.data as SteamApps;
    } else {
        console.error(`${appList.status}: Unable to retrieve response \n ${appList.data}`);
    }
    console.log(`Logged in as ${client.user.tag}! Current time: ${time}`);
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

    if (!message.author.bot) {
        const channel = await client.channels.fetch(chID) as TextChannel;
        let time = currentDate.getHours() + ":" + currentDate.getMinutes();
        console.log(`Making request at: ${time}`);
        const file = fs.readFileSync(subscriptionList, 'utf8');
        const lines = file.split(/\r?\n/);
        for (const line of lines) {
            console.log(line);
            const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${line}&count=1&maxlength=${MAXLENGTH}&format=json`
            const req = await axios.get(url);

            if (req.status === 200) {
                const data = req.data as News;
                console.log(data);
                embedGameNews(data, channel);
            } else {
                console.log(req.status);
            }

        }
    }

    if (message.author.bot || !message.content.startsWith(prefix)) {
        return;
    }
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    if (args.length < 1) {
        return;
    }
    const command = args.shift()!.toLowerCase();
    const commandFile = commands.get(command) as Command;
    console.log(command);
    console.log(commandFile);
    if (!commandFile) {
        return;
    }
    if (commands.size < 1) {
        return;
    }

    commandFile.execute({
        msg: message
    });
});

/* cron.schedule('*30 * * * *', async () => {

    const channel = await client.channels.fetch(chID) as TextChannel;
    let time = currentDate.getHours() + ":" + currentDate.getMinutes();
    console.log(`Making request at: ${time}`);
    const file = fs.readFileSync(subscriptionList);
    for (const line in file) {
        const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${line}&count=1&maxlength=${MAXLENGTH}&format=json`
        const req = await axios.get(url);

    if (req.status === 200) {
        const data = req.data as News;
        console.log(data);
        embedGameNews(data, channel);
    } else {
        console.log(req.status);
    }

    }
 }); */


function embedGameNews(response: News, channel: TextChannel) {
    if (!response) {
        return;
    }
    const embed = new MessageEmbed();
    embed.setColor('#FF0000');
    let gameTitle = '';
    for (const app of steamAppList.applist.apps) {
        if (app.appid === response.appnews.appid) {
            gameTitle = app.name;
            break;
        }
    }
    embed.setTitle(`${gameTitle} - ${response.appnews.newsitems[0].title} - Steam News`);
    embed.setURL(response.appnews.newsitems[0].url);
    embed.setFooter(response.appnews.newsitems[0].author);
    const dateObj = new Date(response.appnews.newsitems[0].date * 1000);
    embed.setTimestamp(dateObj);
    embed.setDescription(`https://steamcommunity.com/games/221100/announcements/detail/3117049349012745522`);
    console.log(embedList[response.appnews.appid]);
    if ((embedList[response.appnews.appid] === undefined)) {
        embedList[response.appnews.appid] = embed;
        channel.send(embed);
        return;
    }

    if (embedList[response.appnews.appid].title !== embed.title) {
        embedList[response.appnews.appid] = embed;
        channel.send(embed);
    }
    channel.send(response.appnews.newsitems[0].url);
}

/* function embedCDNews(response: News, channel: TextChannel) {
    console.log(`Posting to channel`);

    if (response) {
        const embed = new MessageEmbed();
        embed.setColor('#708090');
        embed.setTitle('Crafting Dead -' + response.appnews.newsitems[0].title + ' - Steam News');
        embed.setURL(response.appnews.newsitems[0].url);
        embed.setThumbnail('https://cdn.akamai.steamstatic.com/steam/apps/657990/header.jpg?t=1636584022');
        const change = response.appnews.newsitems[0].contents.split('- ');
        let added = [];
        let updated = [];
        let bugs = [];

        const addedReg = '(Added.*)';
        const updatedReg = '(Updated.*)';
        const bugsReg = '(Fixed.*)';


        change.forEach(line => {
            if (line.match(addedReg)) {
                added.push("- " + line);
            }
            if (line.match(updatedReg)) {
                updated.push("- " + line);
            }
            if (line.match(bugsReg)) {
                bugs.push("- " + line);
            }
        });

        embed.addField('Added Items', added);
        embed.addField('Updated', updated);
        embed.addField('Bug Fixes', bugs);
        embed.setDescription(change[0]);
        embed.setFooter(response.appnews.newsitems[0].author);
        const dateObj = new Date(response.appnews.newsitems[0].date * 1000);
        embed.setTimestamp(dateObj);

        if (initEmbed.title === null) {
            initEmbed = embed;
            channel.send(embed);
            return;
        }

        if (initEmbed.title !== embed.title) {
            initEmbed = embed;
            channel.send(embed);
        }
    }

}
 */



client.login(process.env.DISCORD_TOKEN);