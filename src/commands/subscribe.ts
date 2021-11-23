import { Command, CommandArgs } from "../models/Command";
import * as fs from 'fs';
import { subscriptionList } from "..";

export = {
    name: 'subscribe',
    description: 'Subscribe to Game News',
    execute(commandArgs: CommandArgs) {

        const gameID = commandArgs.msg.content.split(' ')[1];

        if(gameID.match('[^0-9.]')){
            return commandArgs.msg.channel.send('Game ID can only be digits');
        }
        try {
            fs.appendFileSync(subscriptionList, gameID +'\n');
        } catch (error) {
            return error;
        }
        commandArgs.msg.channel.send('Succesfully Subscribed');
    }

} as Command;