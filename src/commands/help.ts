import { prefix } from "..";
import { Command, CommandArgs } from "../models/Command";

export = {
    name: 'help',
    description: 'List the operations of all the commands',
    args: true,
    usage: `required: <command name>`,
    execute(commandArgs: CommandArgs) {
        let data = [];
        const commands = commandArgs.commands;
        if (commandArgs.args.length) {
            const name = commandArgs.args[0].toLowerCase();
            const command = commands.get(name) as Command;

            if (!command) {
                return commandArgs.msg.reply(`that\'s not a valid command!`);
            }
            data.push(`**Name:** ${command.name}`);
            if (command.description) data.push(`**Description:** ${command.description}`);
            if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

            commandArgs.msg.channel.send(data.toString());

        } else {
            data.push(`Here's a list of all my commands: `);
            data.push(commands.map(command => (command as Command).name).join(', '));
            data.push(`\nYou can send \`${prefix}help <command name>\` to get info on a specific command!`);

            return commandArgs.msg.channel.send(data.toString());
        }

    }

} as Command;