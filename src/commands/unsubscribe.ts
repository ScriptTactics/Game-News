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
            const rl = fs.createReadStream(subscriptionList, {
                flags: 'a+',
                encoding: 'utf8'
            });
            let found = '';
            rl.on('error', (err) => { throw err; });
            let fileData: string[] = [];

            rl.on('data', (data) => {
                found = data.toString().split('\n').find(x => { return x === gameID });
                data.toString().split('\n').forEach(id => {
                    if (gameID !== id) {
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
                    commandArgs.msg.channel.send('Succesfully Unsubscribed');
                } else {
                    return commandArgs.msg.channel.send(`You are not subscribed to ${gameID}`);
                }
            });
        } catch (error) {
            return error;
        }
    }

} as Command;