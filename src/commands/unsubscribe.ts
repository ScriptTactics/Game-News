import { Command, CommandArgs } from "../models/Command";
import * as fs from 'fs';
import { subscriptionList } from "..";

export = {
    name: 'unsubscribe',
    description: 'Un-Subscribe to Game News',
    args: true,
    usage: `<GameName>:required`,
    execute(commandArgs: CommandArgs) {

        const gameName = commandArgs.args.toString().replace(/,/g, ' ').toLowerCase();

        const app = commandArgs.appList.applist.apps.find(x => { return x.name.toLocaleLowerCase() === gameName });

        if (!app) {
            return commandArgs.msg.channel.send('Could not find that game');
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
                found = data.toString().split('\n').find(x => { return x === app.appid.toString() });
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
                    commandArgs.msg.channel.send('Successfully Unsubscribed');
                } else {
                    return commandArgs.msg.channel.send(`You are not subscribed to ${gameName}`);
                }
            });
        } catch (error) {
            return error;
        }
    }

} as Command;