const mongo = require("mongoose");
const { mongourl } = require("../config.dev.json");

module.exports.connect = async () => {
	await mongo.connect(mongourl);
	return mongo;
};