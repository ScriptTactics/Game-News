import * as fs from 'fs';
import { steamAppList, subscriptionListFile } from "..";
import { ImportCommand } from "../models/ImportCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { App } from '../models/steam-apps/GetAppListResponse';
import { Game, Subscriptions } from '../models/Subscriptions';

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

        const game = {
            gameID: app.appid,
            gameName: app.name
        } as Game;

        try {

            fs.readFile(subscriptionListFile, 'utf8', (err, data) => {
                if (err) {
                    console.error(`${err} Unable to parse JSON`);
                } else {
                    let subscriptionList: Subscriptions = {
                        gameList: []
                    };

                    if (data.length > 0) {
                        let subscriptions = JSON.parse(data) as Subscriptions;

                        const found = subscriptionList.gameList.find(x => x.gameID === app.appid);

                        if (found) {
                            return interaction.reply('You are not subscribed to that');
                        } else {
                            const filteredList = subscriptions.gameList.filter(x => x.gameID !== app.appid);
                            subscriptionList.gameList = filteredList;
                            fs.writeFile(subscriptionListFile, JSON.stringify(subscriptionList, null, 4), (err) => {
                                if (err) {
                                    console.error(err);
                                }
                            });
                            return interaction.reply('Successfully Unsubscribed');
                        }

                    } else {
                        return interaction.reply('You are not subscribed to anything');
                    }
                }
            });

        } catch (error) {
            return error;
        }

    }
} as ImportCommand;
