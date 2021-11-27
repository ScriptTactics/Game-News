import { SlashCommandBuilder } from "@discordjs/builders";
import { steamAppList, subscriptionList } from "..";
import { ImportCommand } from "../models/ImportCommand";
import * as fs from 'fs';
import { App } from "../models/steam-apps/GetAppListResponse";
import { MessageEmbed } from "discord.js";

export = {
    data: new SlashCommandBuilder()
        .setName('subscriptions')
        .setDescription('List current subscriptions'),
    async execute(interaction) {
        const apps = steamAppList.applist.apps;

        try {
            const rl = fs.createReadStream(subscriptionList, {
                flags: 'a+',
                encoding: 'utf8'
            });

            let subscriptions: App[] = [];
            rl.on('error', (err) => { console.error(err); });
            rl.on('data', (data) => {
                data.toString().split(',').forEach(id => {
                    const match = apps.find(x => { return x.appid.toString() === id });
                    subscriptions.push(match);
                });
            });
            rl.on('end', () => {
                if (subscriptions.length > 0) {
                    const embed = new MessageEmbed();
                    embed.setTitle("Subscriptions");
                    embed.setDescription("You are currently subscribed to the following: ");
                    embed.setColor('#006775');


                    for (const app of subscriptions) {
                        if (app !== undefined) {
                            embed.addFields({
                                name: app.name,
                                value: app.appid.toString(),
                                inline: true
                            });
                        }
                    }
                    interaction.reply({ content: ' ', ephemeral: true, embeds: [embed] });
                }
            })

        } catch (error) { }

    }
} as ImportCommand;