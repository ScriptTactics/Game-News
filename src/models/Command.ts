import { Message } from "discord.js";

export interface Command {
    name: string;
    description: string;
    execute(commandArgs: CommandArgs): void;
}
export interface CommandArgs {
    msg: Message;
}