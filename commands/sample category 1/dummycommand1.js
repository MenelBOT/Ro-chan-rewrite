// Imported main bot file to access client object
const { bot } = require("../../bot");

// Imported modules

// Command sensitive constants

// This is only here for intellisense, remove if no further work will be done on the command
const Discord = require("discord.js");

module.exports = {
	name: "dummycommand1",
	description: "A descriptive summary of the command",
	usage: "What should be appended after the command name when sending the message\n<> - Required arguments, [] - Optional arguments",
    aliases: ["dc1", "dummyc1"], // What other names to register this exact command under? Beware of conflicts!
    /**
     * 
     * @param {Discord.Message} message The message that triggered this command
     * @param {Array.<String>} args The command argument array
     */
	execute(message, args) {

        if (args[0].toLowerCase() == "ping") message.reply(`Pong!\nCommand execution took ${Date.now() - message.createdTimestamp}\nAPI latency is ${Math.round(bot.ws.ping)}`);

	}
};