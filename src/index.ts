import { Client, Collection, Intents, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
import { readdir } from 'fs';
import { Command } from './models/Command';
import { SteamApps } from './models/steam-apps/GetAppListResponse';
import * as fs from 'fs';
import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { ImportCommand } from './models/ImportCommand';
import { SlashCommandBuilder } from '@discordjs/builders';

env.config();
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
export const MAXLENGTH = 1;
export const chID = "913147152635658280";

const guildID = '732772163471540335';
const clientID = '912373417917943939';

const pingCommand = new SlashCommandBuilder().setName('ping').setDescription('Check if this interaction is responsive');


const commands = new Collection();
readdir('dist/commands', async (err, allFiles) => {
    if (err) {
        console.error(`Unable to load commands: ${err}`);
    }
    let files = allFiles.filter(f => f.split('.').pop() === ('js'));
    if (files.length <= 0) {
        console.log(`No commands found!`);
        return;
    }
    for (const file of files) {

        /*        const importedCommand = await import(`./commands/${file}`) as ImportCommand;
               const name = importedCommand;
               console.log(name);
               const cmd = { ...importedCommand };

               commands.set(importedCommand, cmd); */
    }
});

commands.set(pingCommand.name, pingCommand);
const r = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await r.put(
            Routes.applicationGuildCommands(clientID, guildID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

let messageList: { [gameId: string]: string } = {};
let currentDate = new Date();
export const prefix = '!';
export const subscriptionList = 'subscriptionList.txt';
let steamAppList: SteamApps;

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
    console.log(interaction);
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;

    if (commandName === 'ping') {
        interaction.reply('pong');
    }
    const rawData = pingCommand.toJSON();
    console.log(rawData);


    const command = commands.get(interaction.commandName) as any;

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {

    }
});
/* client.on('messageCreate', message => {
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

}); */

cron.schedule('0 */1 * * *', async () => {

    const channel = await client.channels.fetch(chID) as TextChannel;
    let time = currentDate.getHours() + ":" + currentDate.getMinutes();
    console.log(`Making request at: ${time}`);

    const rl = fs.createReadStream(subscriptionList, {
        flags: 'a+',
        encoding: 'utf8'
    });
    rl.on('error', (err) => { console.error(err); });
    rl.on('data', async (line) => {
        line.toString().split('\n').forEach(i => {
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
        channel.send(response.appnews.newsitems[0].url);
        return;
    }

    if (messageList[response.appnews.appid] !== message) {
        messageList[response.appnews.appid] = message;
        channel.send(message);
    }
}


client.login(process.env.DISCORD_TOKEN);