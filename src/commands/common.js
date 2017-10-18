const Discord = require("discord.js");
const sql = require("sqlite");
const steam = require("steam-web");
const auth = require("../auth.json");
const fs = require("fs");

var db = JSON.parse(fs.readFileSync("./src/data.json", "utf8"));

const api = new steam({
    apiKey: auth.key,
    format: "json"
});

/*
* THIS CODE IS A FUCKING MESS HOLY SHIT
*
* Todo: Refactoring
*
 */
module.exports.run = (client, message, args) => {
    let user = message.author;
    let other = message.mentions.users.first();
    if (!other) return;
    let steamid = db[user.id].steamid;
    let otherid = db[other.id].steamid;
    if (!steamid) {
        message.channel.send("Please connect your steam profile first!");
        return;
    };
    if (!otherid) {
        message.channel.send("Other user has no steam profile connected!");
        return;
    };
    getCommonList(steamid, otherid, function sendMessage(list){
        if(args[1]){
            getGameTags(list, function (tagList){
                let matchList = [];
                tagList.forEach(function(element) {
                    if(element.tags.indexOf(args[1]) != -1) {
                        matchList.push(element.game);
                    }
                });
                let counter = 0;
                let msg = "";
                while (msg.length + matchList[counter].name.length < 500) {
                    msg = msg.concat(`${matchList[counter].name}\n`);
                    counter++;
                }
                let embed = new Discord.RichEmbed().setTitle(`${other.tag} has ${matchList.length} games in common`);
                embed.setDescription(msg);
                if (counter < matchList.length) {
                    embed.setFooter(`Only showing ${counter} out of ${matchList.length} games`)
                }
                message.channel.send(embed);
            })
        } else{
            let counter = 0;
            let msg = "";
            while (msg.length + list[counter].name.length < 500) {
                msg = msg.concat(`${list[counter].name}\n`);
                counter++;
            }
            let embed = new Discord.RichEmbed().setTitle(`${other.tag} has ${list.length} games in common`);
            embed.setDescription(msg);
            if (counter < list.length) {
                embed.setFooter(`Only showing ${counter} out of ${list.length} games`)
            }
            message.channel.send(embed);
        }
    });    
};

function getCommonList(steamid, otherid, callbackFunction){
    api.getOwnedGames({
        steamid: steamid,
        include_appinfo: 1,
        callback: (err, userdata) => {
            let appidsUser = [];
            userdata.response.games.forEach((game, _) => {
                appidsUser.push(game.appid);
            });
            list = generateList(appidsUser,otherid, userdata, callbackFunction);
        }
    });
}

function generateList(appidsUser, otherid, userdata, callbackFunction){
    let list
    api.getOwnedGames({
        steamid: otherid,
        include_appinfo: 1,
        callback: (err, otherdata) => {
            let appidsOther = [];
            otherdata.response.games.forEach((game, _) => {
                appidsOther.push(game.appid);
            });
            let commonIds = appidsUser.filter((id) => {
                return (appidsOther.indexOf(id) > -1)
            });
            list = userdata.response.games.filter((game) => {
                return (appidsOther.indexOf(game.appid) > -1)
            });
            callbackFunction(list);
        }
    })
}

function getGameTags(gameList, callback){
    let tagList = [];
    recursiveTaggCollector(gameList,tagList,0,callback)
}
function recursiveTaggCollector(list, tagList, index, callback){
    if(list.length == index){
        callback(tagList);
    } else{
        currentGame = list[index];

        console.log(index);
        tinyreq("http://store.steampowered.com/app/" + currentGame.appid + "/", function(err, body) {
            let $ = cheerio.load(body);
            var currentTags = $("a.app_tag").text().replace(/\t/g,'').split("\n");
            currentTags.shift();

            gameTag = {
                game: currentGame,
                tags: currentTags
            }
            tagList.push(gameTag);
            recursiveTaggCollector(list, tagList, index + 1, callback);
        });
    }
}

/**
 * Load app page and give tags to callback function
 */
module.exports.help = {
    name: "Common",
    command: "common",
    required: 1,
    optional: 2,
    description: "Show which games you have in common."
}