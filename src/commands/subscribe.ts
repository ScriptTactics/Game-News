import * as fs from 'fs';
import { steamAppList, subscriptionList } from "..";
import { ImportCommand } from "../models/ImportCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

export = {
    data: new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('Subscribe to game news')
        .addStringOption(option =>
            option.setName('gamename')
                .setDescription(`GameName to subscribe to`)
                .setRequired(true)
        ),
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
            let duplicate = false;
            rl.on('error', (err) => { console.error(err); });
            rl.on('data', (data) => {
                const found = data.toString().split(',').find(value => { return value === app.appid.toString() });
                if (found) {
                    duplicate = true;
                    return interaction.reply('You are already subscribed to that');

                }


            });
            rl.on('end', () => {
                if (!duplicate) {
                    const file = fs.createWriteStream(subscriptionList, { flags: 'a+' });
                    file.on('error', (err) => { console.error(err); });
                    file.write(app.appid.toString() + ',');
                    file.end();
                    interaction.reply('Successfully Subscribed');
                }
            });

        } catch (error) {
            return error;
        }
    }
} as ImportCommand;