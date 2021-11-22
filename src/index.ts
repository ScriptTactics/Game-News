import { Client, MessageEmbed, TextChannel } from 'discord.js';
import * as env from 'dotenv';
import cron from 'node-cron';
import needle from 'needle';
import { News } from './models/steam-news/steam-news-response/steamNewsModelResponse';
const client = new Client();
env.config();

export const GAMEID = "657990";
export const MAXLENGTH = 5000;
export const chID = "";
const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${GAMEID}&count=1&maxlength=${MAXLENGTH}&format=json`
let initEmbed = new MessageEmbed();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.once("shardReconnecting", id => {
    console.log(`Shard with ID ${id} reconnected`);
});

client.once("shardDisconnect", (event, shardID) => {
    console.log(`Disconnected from event ${event} with ID ${shardID}`);
});

cron.schedule('*/10 * * * *', async () => {
    const stream = needle.get(url, {
        timeout: 20000
    });

    stream.on('data', (data: string) => {
        console.log(data);
        try {
            const json = JSON.parse(data);
            console.log(json);
            postNewsToChannel(json);
        } catch (error) {
            console.log(error);
            stream.emit('timeout');
        }
    })

});


async function postNewsToChannel(response: News) {
    const channel = await client.channels.fetch(chID) as TextChannel;
    if (response) {
        const embed = new MessageEmbed();
        embed.setColor('#708090');
        embed.setTitle(response.appnews.newsitems[0].title);
        embed.setURL(response.appnews.newsitems[0].url);
        embed.setDescription(response.appnews.newsitems[0].contents);
        embed.setFooter(response.appnews.newsitems[0].author);

        if (initEmbed.title !== embed.title) {
            channel.send(embed);
        } else {
            initEmbed = embed;
        }
    }

}




client.login(process.env.DISCORD_TOKEN);