import { Client, Collection, MessageEmbed, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import axios, { Axios } from 'axios';
import cron from 'node-cron';
import needle from 'needle';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
import { readdir } from 'fs';
import { Command } from './models/Command';
const client = new Client();
env.config();

export const GAMEID = "657990";
export const MAXLENGTH = 5000;
export const chID = "870509503475486740";
const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${GAMEID}&count=1&maxlength=${MAXLENGTH}&format=json`
let initEmbed = new MessageEmbed();
let currentDate = new Date();
const prefix = '!';
export const subscriptionList = 'subscriptionList.txt';

client.on('ready', () => {
    let time = currentDate.getHours() + ":" + currentDate.getMinutes();
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

cron.schedule('*/30 * * * *', async () => {
    const channel = await client.channels.fetch(chID) as TextChannel;
    let time = currentDate.getHours() + ":" + currentDate.getMinutes();
    console.log(`Making request at: ${time}`);
     const req = await axios.get(url);

    if (req.status === 200) {
        const data = req.data as News;
        console.log(data);
        postNewsToChannel(data, channel);
    } else {
        console.log(req.status);
    }

 });


function postNewsToChannel(response: News, channel: TextChannel) {
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




client.login(process.env.DISCORD_TOKEN);