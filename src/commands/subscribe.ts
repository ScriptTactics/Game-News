import { Command, CommandArgs } from "../models/Command";
import * as fs from 'fs';
import { subscriptionList } from "..";

export = {
    name: 'subscribe',
    description: 'Subscribe to Game News',
    args: true,
    usage: `<GameName>:required`,
    async execute(commandArgs: CommandArgs) {

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
            let duplicate = false;
            rl.on('error', (err) => { console.error(err); });
            rl.on('data', (data) => {
                const found = data.toString().split('\n').find(value => { return value === app.appid.toString() });
                if (found) {
                    duplicate = true;
                    return commandArgs.msg.channel.send('You are already subscribed to that');

                }


            });
            rl.on('end', () => {
                if (!duplicate) {
                    const file = fs.createWriteStream(subscriptionList, { flags: 'a+' });
                    file.on('error', (err) => { console.error(err); });
                    file.write(app.appid.toString() + '\n');
                    file.end();
                    commandArgs.msg.channel.send('Successfully Subscribed');
                }
            });

        } catch (error) {
            return error;
        }
    }

} as Command;