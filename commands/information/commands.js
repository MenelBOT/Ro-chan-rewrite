// Imported modules
const fs = require("fs");

// Command sensitive constants
const Discord = require("discord.js");
const commandFolders = fs.readdirSync("./commands");
const { prefix } = require("../../config.json");
// Imported main bot file
const { bot, createCurrentFooter } = require("../../bot");


module.exports = {
	name: "commands",
	description: "Lists all the commands the bot has\nSends details about a command if a command is passed as an argument instead.",
	usage: "[command name]\n<> - Required arguments, [] - Optional arguments",
    aliases: ["help", "cmds"], // What other names to register this exact command under? Beware of conflicts!
    /**
     * 
     * @param {Discord.Message} message The message that triggered this command
     * @param {Array.<String>} args The command argument array
     */
	execute(message, args) {

        // If there is no command argument send the command list

		if (!args.length) { 

            const embed = new Discord.MessageEmbed();

            // Creating value arrays

            // Schema is [[category, command], [category, command]...]

            const workarray = [];

            commandFolders.forEach(folder => {

				const commandsinfolder = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));

				if (!commandsinfolder == []) {

					commandsinfolder.forEach(cmd => {

						if (!(cmd == [])) workarray.push([folder, cmd]);

					});

				}

			});


            // Converting arrays to map

            const catmap = new Map();

			workarray.forEach(pair => {

				if (catmap.has(pair[0])) catmap.set(pair[0], [catmap.get(pair[0]), pair[1].replace(".js", "")].flat());

				else catmap.set(pair[0], [pair[1].replace(".js", "")].flat());

			});

			catmap.forEach(function(catcommands, category) {

				embed.addField(category, catcommands.join(", "), false);

			});

            // Set up embed

           embed.setColor("#36393F")
           .setTitle("This is the list of all my commands!")
           .setDescription(`You can also send \"${prefix}help <command>\" to get more information about a specific command!`)
           .setFooter({ text: createCurrentFooter(), iconURL: bot.user.displayAvatarURL({ size: 256, dynamic: true }) });

           // Reply to trigger message

           return message.reply({ embeds: [ embed ] });

        }

        // Get registered commands

        const { commands } = bot;

        // Check if arguments are a registered command

        // If there is a command argument check if it's a registered command or alias

        const command = commands.get(args[0]) || commands.find(c => c.aliases && c.aliases.includes(args[0]));

        // If the command is not registered in the bot, notify the user and abort
        if (!command) return message.reply(`No command with name ${args[0]} exists!`);

        // Set up embed detailing given command

        const embed = new Discord.MessageEmbed({color:"#36393F", title: `Command ${args[0]}`, description: " "});

        if (command.aliases) embed.addField("Aliases", command.aliases.join(", "), false);

        if (command.description) embed.addField("Description", command.description, false);

        if (command.usage) embed.addField("Usage", `${prefix}${command.name} ${command.usage}`, false);

        if (command.cooldown) embed.addField("Cooldown", command.cooldown, false);

        return message.reply({ embeds: [ embed ] });

	}
};