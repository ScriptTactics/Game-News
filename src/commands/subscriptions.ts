import { subscriptionListFile } from "..";
import { ImportCommand } from "../models/ImportCommand";
import * as fs from "fs";
import { Subscriptions } from "../models/Subscriptions";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export = {
    data: new SlashCommandBuilder()
        .setName("subscriptions")
        .setDescription("List current subscriptions"),
    async execute(interaction) {

        try {
            fs.readFile(subscriptionListFile, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                } else {
                    if (data.length > 0) {
                        let list = JSON.parse(data) as Subscriptions;

                        if (list.gameList.length > 0) {
                            const embed = new EmbedBuilder();
                            embed.setTitle("Subscriptions");
                            embed.setDescription(
                                "You are currently subscribed to the following: "
                            );
                            embed.setColor([0,103,117]);
                            //{ '0': 0, '1': 103, '2': 117 } as RGBTuple

                            for (const app of list.gameList) {
                                if (app !== undefined) {
                                    embed.addFields({
                                        name: app.gameName,
                                        value: app.gameID.toString(),
                                        inline: true,
                                    });
                                }
                            }
                            return interaction.reply({ content: " ", ephemeral: true, embeds: [embed] });
                        } else {
                            return interaction.reply('You are not currently subscribed to anything');
                        }
                    } else {
                        return interaction.reply('You are not currently subscribed to anything');
                    }
                }

            });
        } catch (error) {
            console.error(error);
        }
    },
} as ImportCommand;
