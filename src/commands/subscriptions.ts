import { SlashCommandBuilder } from "@discordjs/builders";
import { subscriptionListFile } from "..";
import { ImportCommand } from "../models/ImportCommand";
import * as fs from "fs";
import { MessageEmbed } from "discord.js";
import { Subscriptions } from "../models/Subscriptions";

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
                            const embed = new MessageEmbed();
                            embed.setTitle("Subscriptions");
                            embed.setDescription(
                                "You are currently subscribed to the following: "
                            );
                            embed.setColor("#006775");

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
