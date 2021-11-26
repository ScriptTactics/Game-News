import { SlashCommandBuilder } from "@discordjs/builders";

export interface ImportCommand {
    data: SlashCommandBuilder;
    execute(): Promise<void>;
}