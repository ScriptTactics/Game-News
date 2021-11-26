import * as fs from 'fs';
import { steamAppList, subscriptionList } from "..";
import { ImportCommand } from "../models/ImportCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

export = {
    data: new SlashCommandBuilder()
        .setName('unsubscribe')
        .setDescription('Un-Subscribe to Game News')
        .addStringOption(option =>
            option.setName('gamename')
                .setDescription('GameName to un-subscribe to')
                .setRequired(true)),
    async execute(interaction) {
        const gameName = interaction.options.getString('gamename');

        const app = steamAppList.applist.apps.find(x => { return x.name.toLocaleLowerCase() === gameName.toLowerCase() });


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

                found = data.toString().split('\n').find(x => { return parseInt(x) === app.appid });
                console.log(found);
                data.toString().split('\n').forEach(id => {
                    if (app.appid.toString() !== id) {
                        fileData.push(id);
                    }
                });
            });


            rl.on('end', () => {
                if (found !== '') {
                    fileData.forEach(x => {
                        fs.writeFile(subscriptionList, x, null, (err) => {
                            if (err) {
                                console.error(err);
                            }
                        });
                    });
                    interaction.reply('Successfully Unsubscribed');
                } else {
                    return interaction.reply(`You are not subscribed to ${gameName}`);
                }
            });
        } catch (error) {
            return error;
        }
    }
} as ImportCommand;
