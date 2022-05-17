// Declaring constants for the bot.

const { prefix, token, ownerId, mongourl } = require("./config.dev.json"); // If you do not have this file yet, rename your config.json to config.dev.json
// This is to make testing possible without actually uploading the test bot token to github.

const Discord = require("discord.js");

const fs = require("fs");

const commandFolders = fs.readdirSync("./commands");

// Intents were introduced by discord to make bot creator lives harder, so here's an entire object of them for future use.
// They are in bitfield form but integers represent them just fine.
const Intents = {
	FLAGS: {
		GUILDS: 1,
		GUILD_MEMBERS: 2,
		GUILD_BANS: 4,
		GUILD_EMOJIS_AND_STICKERS: 8,
		GUILD_INTEGRATIONS: 16,
		GUILD_WEBHOOKS: 32,
		GUILD_INVITES: 64,
		GUILD_VOICE_STATES: 128,
		GUILD_PRESENCES: 256,
		GUILD_MESSAGES: 512,
		GUILD_MESSAGE_REACTIONS: 1024,
		GUILD_MESSAGE_TYPING: 2048,
		DIRECT_MESSAGES: 4096,
		DIRECT_MESSAGE_REACTIONS: 8192,
		DIRECT_MESSAGE_TYPING: 16384,
		GUILD_SCHEDULED_EVENTS: 65536
	}
};

// Permissions is an object containing all the possible bit values for each permission on discord. Due to the fact that
// they definitely go over the 32 bit integer limit they are stored as BigInts here as indicated by the n suffix
const Permissions = {
	FLAGS: {
		CREATE_INSTANT_INVITE: 1n,
		KICK_MEMBERS: 2n,
		BAN_MEMBERS: 4n,
		ADMINISTRATOR: 8n,
		MANAGE_CHANNELS: 16n,
		MANAGE_GUILD: 32n,
		ADD_REACTIONS: 64n,
		VIEW_AUDIT_LOG: 128n,
		PRIORITY_SPEAKER: 256n,
		STREAM: 512n,
		VIEW_CHANNEL: 1024n,
		SEND_MESSAGES: 2048n,
		SEND_TTS_MESSAGES: 4096n,
		MANAGE_MESSAGES: 8192n,
		EMBED_LINKS: 16384n,
		ATTACH_FILES: 32768n,
		READ_MESSAGE_HISTORY: 65536n,
		MENTION_EVERYONE: 131072n,
		USE_EXTERNAL_EMOJIS: 262144n,
		VIEW_GUILD_INSIGHTS: 524288n,
		CONNECT: 1048576n,
		SPEAK: 2097152n,
		MUTE_MEMBERS: 4194304n,
		DEAFEN_MEMBERS: 8388608n,
		MOVE_MEMBERS: 16777216n,
		USE_VAD: 33554432n,
		CHANGE_NICKNAME: 67108864n,
		MANAGE_NICKNAMES: 134217728n,
		MANAGE_ROLES: 268435456n,
		MANAGE_WEBHOOKS: 536870912n,
		MANAGE_EMOJIS_AND_STICKERS: 1073741824n,
		USE_APPLICATION_COMMANDS: 2147483648n,
		REQUEST_TO_SPEAK: 4294967296n,
		MANAGE_EVENTS: 8589934592n,
		MANAGE_THREADS: 17179869184n,
		USE_PUBLIC_THREADS: 34359738368n,
		CREATE_PUBLIC_THREADS: 34359738368n,
		USE_PRIVATE_THREADS: 68719476736n,
		CREATE_PRIVATE_THREADS: 68719476736n,
		USE_EXTERNAL_STICKERS: 137438953472n,
		SEND_MESSAGES_IN_THREADS: 274877906944n,
		START_EMBEDDED_ACTIVITIES: 549755813888n,
		MODERATE_MEMBERS: 1099511627776n
	},
	ALL: 2199023255551n,
	DEFAULT: 104324673n,
	STAGE_MODERATOR: 20971536n,
	defaultBit: 0n
};

// These are just some helpers discord provides to assist in properly formatting code snippets for discord messages
const { inlineCode, codeBlock } = require("@discordjs/builders");

// These are used for error handling and more direct terminal access.
const { exit, stdout, stdin } = require("process");

// Extending node.js console using the console-stamp dependency
require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });

// Import database utility

const mongo = require("mongoose");


const bot = new Discord.Client({ partials: ["MESSAGE", "CHANNEL", "REACTION"], intents: [ // This abomination here basically tells discord to behave like in v11 and send us every gateway event
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_BANS,
	Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
	Intents.FLAGS.GUILD_INVITES,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.DIRECT_MESSAGES
], allowedMentions: { "parse": ["users", "roles"], repliedUser: true } }); // This makes it so the bot cannot ping @everyone or @here. It can still ping users and roles
// changing repliedUser to false will make the bot not ping the user when replying to them using discord's built in message.reply() function.
// This only serves as a default and can be overridden by passing an allowedMentions object to the message.reply() or channel.send() functions.


// Defining helper functions

// The following function is a no operation function so we will disable
// eslint no-empty-function as we know it's empty and don't plan on adding
// a return nothing operation as that would make it no longer noop.
/**
* Does nothing.
*
* Useful when an operation needs a callback function but you don't want it to do anything
*/
// eslint-disable-next-line no-empty-function
function noop() {

}

/**
 * @param {Number} min Any number in range of 2^32. If not provided, defaults to 0
 * @param {Number} max Any number in range of 2^32. If not provided, defaults to 10000
 * @returns Random number between max and min.
 */
function getRandomInt(min = 0, max = 10000) {

	if (typeof min != "number") min = 0;

	if (typeof max != "number") max = 10000;

	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;

}

/**
 * @param {String} text String to prepare for evaluation.
 *
 * @summary
 * Returns string that is eval()-"safe".
 *
 * Since non string objects are always eval()-"safe" it returns them back if given as argument.
 */
function clean(text) {

	if (typeof text === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));

	else return text;

}

/**
 * @param {Number} bitfield Bitfield to convert to String.
 * @summary
 * Returns string representation of a discord permission bitfield if one exists.
 *
 * If there is no permission with given bitfield returns null.
 */
function permBitToString(bitfield = 0) {

	if (typeof bitfield != "number" || typeof bitfield != "bigint") bitfield = 0n;

	for (const key in Permissions.FLAGS)
		if (Permissions.FLAGS[key] == bitfield) return key;
	return null;

}

/**
 @returns String with formatting "DD/MM/YYYY at HH:MM:SS GMT+0SERVERGMT:00"
 */
function CreateCurrentFooter() {

	const todaysdate = new Date();
	const sec = String(todaysdate.getSeconds()).padStart(2, "0");
	const min = String(todaysdate.getMinutes()).padStart(2, "0");
	const hr = String(todaysdate.getHours()).padStart(2, "0");
	const dd = String(todaysdate.getDate()).padStart(2, "0");
	const mm = String(todaysdate.getMonth() + 1).padStart(2, "0"); // because January is 0
	const yyyy = todaysdate.getFullYear();
	const todaygtm = (todaysdate.getTimezoneOffset() / 60).toString();
	const today = dd + "/" + mm + "/" + yyyy + " at " + hr + ":" + min + ":" + sec + " GMT+0" + todaygtm.slice(1) + ":00";
	return today;

}

// Exporting helper functions in case file is ever imported

module.exports = {
	noop: noop,
	getRandomInt: getRandomInt,
	clean: clean,
	permBitToString: permBitToString,
	createCurrentFooter: CreateCurrentFooter,
	bot: bot
};

// Make sure that any database connection is closed when the process is stopped

process.on("SIGINT", function() {

	mongo.connection.close(function() {

		console.log("KEYBOARD INTERRUPT DETECTED");
		console.log("Database access closed due to app termination");
		process.exit(1);

	});

});

process.on("SIGTERM", () => {

	mongo.connection.close(() => {

		console.log("PROCESS CLOSE SIGNAL DETECTED");
		console.log("Database closed due to dyno restart");
		process.exit(143);

	});

});

bot.on("ready", async () => {

	console.log("Starting bot. . .");

	console.log("Attempting connection to database. . .");

	// Since this is a persistent connection that only closes with the bot, we don't use the connectMongoose.js utility

	mongo.connect(mongourl).then(() => {

		console.log("Connected to MongoDB!");

		console.log("Registering commands. . .");

		bot.commands = new Discord.Collection();

		for (const folder of commandFolders) {

			const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));

			for (const file of commandFiles) {

				const command = require(`./commands/${folder}/${file}`);
				bot.commands.set(command.name, command);

			}

		}

		console.log("Done!");

		console.log("Setting bot status...");

		bot.user.setActivity("gararu～", { type: "PLAYING" });

		console.log("Bot status set to " + bot.user.presence.activities);

		console.log("Bot is ready.");

	}).catch(error => {

		console.log(`Couldn't connect to MongoDB!\nError: ${error}`);
		process.exit(1);

	});

});

bot.on("messageCreate", async message => {

	// Create arguments array and command variable

	const args = message.content.slice(prefix.length).trim().split(/\s+/);
	const commandName = args.shift().toLowerCase();
	if (message.author.id == bot.user.id) return;

	const command = bot.commands.get(commandName) || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (command) {

		// Some command was executed

		try {

			if (message.content.startsWith(prefix)) command.execute(message, args);

		} catch (error) {

			console.error(error);
			message.reply("An unknown error occured while executing the command...");

		}

	}

});

bot.login(token);