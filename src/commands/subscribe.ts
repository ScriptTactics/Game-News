import { Command, CommandArgs } from "../models/Command";
import * as fs from 'fs';
import { subscriptionList } from "..";

export = {
    name: 'subscribe',
    description: 'Subscribe to Game News',
    async execute(commandArgs: CommandArgs) {

        const gameID = commandArgs.msg.content.split(' ')[1];

        if(gameID.match('[^0-9.]')){
            return commandArgs.msg.channel.send('Game ID can only be digits');
        }
        try {
            const rl = fs.createReadStream(subscriptionList, {
                flags: 'a+',
                encoding: 'utf8'
            });
            let duplicate = false;
            rl.on('error', (err) => { throw err; });
            rl.on('data', (data) => {
                const found = data.toString().split('\n').find(value => { return value === gameID });
                if (found) {
                    duplicate = true;
                    return commandArgs.msg.channel.send('You are already subscribed to that');

                }


            });
            rl.on('end', () => {
                if (!duplicate) {
                    const file = fs.createWriteStream(subscriptionList, { flags: 'a+' });
                    file.on('error', (err) => { throw err; });
                    file.write(gameID + '\n');
                    file.end();
                    commandArgs.msg.channel.send('Succesfully Subscribed');
                }
            });

        } catch (error) {
            return error;
        }
    }

} as Command;