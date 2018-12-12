require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client({disabledEveryone: true});
const fs = require('fs');

//Load in all the commands from ./commands/
bot.commands = new Discord.Collection();
fs.readdir("./commands/", (err, data) =>{
    if(err) console.log(err);
    let files = data.filter(file => file.split(".").pop() === "js");
    if(files.length <= 0){
        return;
    }
    files.forEach((file, index) => {
        let exports = require(`./commands/${file}`);
        bot.commands.set(exports.help.name, exports);
    });
    console.log(`Loaded ${files.length} commands!`);
});

//Set the bot activity
bot.on('ready', () => {
    bot.user.setActivity(
        `Salty Stats v${process.env.BOT_VERSION} || s!help`, 
        {type:"PLAYING"})
    .catch(console.error);
});

//Setup command handler
bot.on('message', msg => {
    if(msg.author.id === bot.user.id) return;
    if(msg.channel.type === "dm") return;

    let prefix = process.env.BOT_PREFIX;
    let content = msg.content.split(" ");
    let cmd = content[0];
    let args = content.slice(1);

    if(content[0].slice(0, 2).toLocaleLowerCase() !== prefix) return;

    let command = bot.commands.get(cmd.slice(prefix.length));
    if(command){
        if(msg.author.id !== process.env.BOT_OWNER_ID){
            msg.channel.send("You aren't cool enough to use this bot :rofl:")
            .then(msg => {msg.delete(5000)});
            return;
        }
        command.run(bot, msg, args);
    }
});

//Login the bot
bot.login(process.env.BOT_TOKEN);