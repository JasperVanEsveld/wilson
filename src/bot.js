const Discord = require("discord.js");
const auth = require("./auth.json");
const fs = require("fs");

/*
Todo: random game pick, check if both has game,
 */

const client = new Discord.Client();
const reply = {
    "marco": "Polo!",
    "geodude": "https://i.imgur.com/YdVoIqp.png",
    "praise be": praiseBe()
};


client.commands = new Discord.Collection();

fs.readdir(`${__dirname}/commands`, (err, files) => {
    if (err) console.error(err);
    files.forEach((file, i) => {
        console.log(file);
        if (file.split(".")[1] !== "js") return;
        let cmd = require(`${__dirname}/commands/${file}`);
        if (cmd.help) {
            client.commands.set(cmd.help.command, cmd);
        };
    });
});

client.on('ready', (evt) => {
    console.log('Connected');
});

client.on('message', (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(auth.prefix)) {
        let msg = message.content.split(/\s+/g);
        let cmd = client.commands.get(msg[0].toLowerCase().slice(1));
        let args = msg.slice(1);
        if (cmd && validateArguments(cmd.help.required, args)) {
            cmd.run(client, message, args);
        }
    }

    if (reply[message.content.toLowerCase()]) {
        message.channel.send(reply[message.content.toLowerCase()]);
    }

    //fluff
    if (message.content.toLowerCase() === '!help') {
        let map_itr = client.commands.values();
        let next = map_itr.next().value;
        let embed = new Discord.RichEmbed();
        embed.setTitle("Commands");
        msg = "";
        while(next != null) {
            next.help.parameters.forEach(function(commandTypes) {
                msg += "**!" + next.help.command;
                commandTypes.forEach(function(parameter) {
                    msg += " <" + parameter + ">";
                });
                msg += "**\n";
            });
            msg += "\t" + next.help.description + "\n \n";
            next = map_itr.next().value;
        }
        embed.setDescription(msg);
        message.channel.send(embed);
    }
});

function validateArguments(required, args) {
    return (required <= args.length);
}

function praiseBe() {
    let embed = new Discord.RichEmbed();
    embed
        .setColor(3447003)
        .setTitle("Me RNGsus")
        .setImage('https://s3.amazonaws.com/files.d20.io/images/33679087/1OxkRToSEBz_UbvRVrGp9A/med.jpg?1495996223971');
    return embed;
}


client.login(auth.token);