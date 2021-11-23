import { Command, CommandArgs } from "../models/Command";
import * as fs from 'fs';
import { subscriptionList } from "..";

export = {
    name: 'unsubscribe',
    description: 'Un-Subscribe to Game News',
    execute(commandArgs: CommandArgs) {

        const gameID = commandArgs.msg.content.split(' ')[1];

        if (gameID.match('[^0-9.]')) {
            return commandArgs.msg.channel.send('Game ID can only be digits');
        }
        try {
            let file = fs.readFileSync(subscriptionList, 'utf8');
            let data: string[] = [];
            for (const line of file) {
                console.log(line);
                if (!line.match(gameID)) {
                    data.push(line);
                }
            }

            for (const l in data) {
                fs.writeFileSync(subscriptionList, l + '\n');
            }
            commandArgs.msg.channel.send('Succesfully Un-Subscribed');

        } catch (error) {
            return error;
        }
    }

} as Command;