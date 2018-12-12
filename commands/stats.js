const discordjs = require('discord.js');

module.exports.run = async (bot, msg, args) => {

    let users = [];

    let responseMsg = msg.channel.send("Fetching users...");

    await msg.channel.guild.fetchMembers()
        .then(result => {
            result.members.forEach(member => {
                let user = member.user;
                let newUser = Object();
                newUser.id = user.id;
                newUser.username = user.username;
                newUser.discriminator = user.discriminator;
                newUser.msgamount = 0;
                newUser.lastmessage = null;
                newUser.lastmessagedate = null;
                users.push(newUser);
            });
        })
        .catch(error => {
            console.error("Error fetching members", error);
        });

    responseMsg.then(msg => msg.edit("Fetching messages..."));
    
    let allMsgs = [];
    let lastMsgId;
    await msg.channel.fetchMessages({limit: 1})
        .then(message => {
            message.forEach(m => {
                lastMsgId = m.id;
            });
        });
    
    let sendResults = function(){

        users.sort(function(a, b){
            let keyA = a.msgamount,
                keyB = b.msgamount;
            if(keyA > keyB) return -1;
            if(keyA < keyB) return 1;
            return 0;
        });

        let usersPerField = 10;
        let userCount = 0;
        let fieldCount = 1;
        let amountOfFields = Math.ceil(users.length / usersPerField);
        let embed = new discordjs.RichEmbed()
            .setTitle(`Found ${allMsgs.length} messages in **${msg.channel.guild.name} -> ${msg.channel.name}**`);
        for(let j = 0; j < amountOfFields; j++){
            
            let a = "";
            for(let i = 0; i < usersPerField; i++){
                let user = users[userCount];
                if(user === undefined) continue;
                let name = `${user.username}#${user.discriminator}`;
                let amount = user.msgamount;
                let lastmsgdate = new Date(user.lastmessagedate).toDateString();
                a = a.concat(`**${name}** : ${amount}\n`)
                .concat(`Last message: ${user.lastmessage}\n`)
                .concat(`At: ${lastmsgdate}\n\n`);
                userCount++;
            }
            embed.addBlankField();
            embed.addField(`***Field ${fieldCount} of ${amountOfFields}***`, a);
            fieldCount++;

        }
        responseMsg.then(msg => msg.delete());
        msg.channel.send(embed);
    }
    
    let getMsg = (id) => {
        msg.channel.fetchMessages({limit: 100, before: id})
            .then(messages => {
                let messagesArr = messages.array();
                let messageCount = messagesArr.length;

                let msgIdArr = [];
                for(m2 of messagesArr){
                    let tempObj = [];
                    tempObj.id = m2.id;
                    tempObj.content = m2.content;
                    tempObj.authorId = m2.author.id;
                    msgIdArr.push(tempObj);

                    for(let u of users){
                        if(u.id === m2.author.id){
                            let amountOfMsgs = u.msgamount;
                            u.msgamount = amountOfMsgs+1;
                            if(m2.content !== null){
                                if(m2.content.length !== 0){
                                    if(m2.createdTimestamp > u.lastmessagedate){
                                        u.lastmessage = m2.content;
                                        u.lastmessagedate = m2.createdTimestamp;
                                    }
                                }
                            }                          
                        }
                    }
                }

                if(messageCount === 0){
                    responseMsg.then(msg => msg.edit("Preparing embed..."));
                    sendResults();
                }else{
                    allMsgs.push(...msgIdArr);
                    let newId = messagesArr[messageCount-1].id;
                    getMsg(newId);
                }
            })
            .catch(error => {
                console.error("Error fetching messages: ", error);
                responseMsg.then(msg => msg.edit("Something went wrong when fetching messages..."));
            });
    }
    getMsg(lastMsgId);
    
}
module.exports.help = {
    "name": "stats",
    "desc": "Get guild stats"
}