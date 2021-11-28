import * as fs from 'fs';
import { steamAppList, subscriptionList } from "..";
import { ImportCommand } from "../models/ImportCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { App } from '../models/steam-apps/GetAppListResponse';

export = {
    data: new SlashCommandBuilder()
        .setName('unsubscribe')
        .setDescription('Un-Subscribe to Game News')
        .addStringOption(option =>
            option.setName('gamename')
                .setDescription('GameName to un-subscribe to')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('gameid')
                .setDescription('Game ID to un-subscribe to')
                .setRequired(false)),
    async execute(interaction) {
        const gameName = interaction.options.getString('gamename');
        const gameId = interaction.options.getNumber('gameid');


        let app: App;
        if (gameName) {
            app = steamAppList.applist.apps.find(x => { return x.name.toLocaleLowerCase() === gameName.toLowerCase() });
        }
        if (gameId) {
            app = steamAppList.applist.apps.find(x => { return x.appid === gameId });
        }

        if (!app) {
            return interaction.reply('Could not find that game');
        }

        try {
            const rl = fs.createReadStream(subscriptionList, {
                flags: 'a+',
                encoding: 'utf8'
            });
            let found: string | undefined;
            rl.on('error', (err) => { throw err; });
            let fileData: string[] = [];

            rl.on('data', (data) => {

                found = data.toString().split(',').find(x => { return parseInt(x) === app.appid });
                data.toString().split(',').forEach(id => {
                    console.log(id);
                    if (app.appid.toString() !== id) {
                        fileData.push(id);
                    }
                });
            });

            rl.on('end', () => {
                console.log(fileData);
                if (found === undefined) {
                    interaction.reply(`You are not subscribed to ${gameName}`);
                } else {
                    fs.writeFileSync(subscriptionList, fileData.toString());
                    interaction.reply('Successfully Unsubscribed');

                }
            })

        } catch (error) {
            return error;
        }

    }
} as ImportCommand;
