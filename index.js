require("dotenv").config();

const {
Client,
GatewayIntentBits,
REST,
Routes,
SlashCommandBuilder,
EmbedBuilder,
PermissionFlagsBits
} = require("discord.js");

const Database = require("better-sqlite3");
const db = new Database("database.db");

const client = new Client({
intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers]
});

const DISCLAIMER =
"⚠ This bot does not guarantee trust. Always trade at your own risk.";

const images = {
vouch:"https://media.discordapp.net/attachments/1468414813536518196/1479946564028993687/content.png",
report:"https://media.discordapp.net/attachments/1468414813536518196/1479946580084658226/content.png",
info:"https://media.discordapp.net/attachments/1468414813536518196/1479946427168718929/content.png",
rep:"https://media.discordapp.net/attachments/1468414813536518196/1479946596136259665/content.png"
};

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
userId TEXT PRIMARY KEY,
vouches INTEGER DEFAULT 0,
reports INTEGER DEFAULT 0,
fakeReports INTEGER DEFAULT 0
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS logs (
type TEXT PRIMARY KEY,
channelId TEXT
)
`).run();

function getUser(id){

let user=db.prepare("SELECT * FROM users WHERE userId=?").get(id);

if(!user){
db.prepare("INSERT INTO users (userId) VALUES (?)").run(id);
user=db.prepare("SELECT * FROM users WHERE userId=?").get(id);
}

return user;
}

function getLogChannel(type,guild){

const row=db.prepare("SELECT channelId FROM logs WHERE type=?").get(type);
if(!row) return null;

return guild.channels.cache.get(row.channelId);
}

const commands=[

new SlashCommandBuilder()
.setName("help")
.setDescription("Show Divine bot commands"),

new SlashCommandBuilder()
.setName("vouch")
.setDescription("Give a vouch")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true))
.addStringOption(o=>
o.setName("message")
.setDescription("Vouch message")
.setRequired(true)),

new SlashCommandBuilder()
.setName("report")
.setDescription("Report scammer")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true))
.addStringOption(o=>
o.setName("reason")
.setDescription("Reason")
.setRequired(true)),

new SlashCommandBuilder()
.setName("fakevouch")
.setDescription("Report fake vouch")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)),

new SlashCommandBuilder()
.setName("info")
.setDescription("User info")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)),

new SlashCommandBuilder()
.setName("rep")
.setDescription("Check reputation")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)),

new SlashCommandBuilder()
.setName("top")
.setDescription("Top trusted users"),

new SlashCommandBuilder()
.setName("topreports")
.setDescription("Most reported users"),

new SlashCommandBuilder()
.setName("setlog")
.setDescription("Set log channel")
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.addStringOption(o=>
o.setName("type")
.setDescription("Log type")
.setRequired(true)
.addChoices(
{name:"vouch",value:"vouch"},
{name:"report",value:"report"}
))
.addChannelOption(o=>
o.setName("channel")
.setDescription("Channel")
.setRequired(true))

].map(c=>c.toJSON());

const rest=new REST({version:"10"}).setToken(process.env.TOKEN);

(async()=>{
await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{body:commands}
);
})();

client.once("clientReady",()=>{
console.log(`Divine bot ready: ${client.user.tag}`);
});

client.on("interactionCreate",async interaction=>{

if(!interaction.isChatInputCommand()) return;

const cmd=interaction.commandName;

if(cmd==="help"){

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("✨ Divine Trust Bot")
.setDescription("Available Commands")
.addFields(
{name:"🤝 /vouch user message",value:"Give a vouch after a successful trade."},
{name:"🚨 /report user reason",value:"Report a scammer."},
{name:"⚠ /fakevouch user",value:"Report fake vouch."},
{name:"👤 /info user",value:"User profile."},
{name:"📊 /rep user",value:"Check vouches."},
{name:"🏆 /top",value:"Top trusted users."},
{name:"📉 /topreports",value:"Most reported users."},
{name:"⚙ /setlog",value:"Set log channel."}
)
.setColor(0x5865F2)
]
});
}

if(cmd==="setlog"){

const type=interaction.options.getString("type");
const channel=interaction.options.getChannel("channel");

db.prepare(`
INSERT OR REPLACE INTO logs VALUES (?,?)
`).run(type,channel.id);

return interaction.reply(`✅ Log channel set to ${channel}`);
}

if(cmd==="vouch"){

const user=interaction.options.getUser("user");
const message=interaction.options.getString("message");

db.prepare(`
UPDATE users SET vouches=vouches+1 WHERE userId=?
`).run(user.id);

const data=getUser(user.id);

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("Vouch Added")
.setDescription(`<@${user.id}> received a vouch`)
.addFields(
{name:"Message",value:message},
{name:"Total Vouches",value:`${data.vouches}`}
)
.setImage(images.vouch)
.setFooter({text:DISCLAIMER})
.setColor("Green")
]
});
}

if(cmd==="report"){

const user=interaction.options.getUser("user");
const reason=interaction.options.getString("reason");

db.prepare(`
UPDATE users SET reports=reports+1 WHERE userId=?
`).run(user.id);

const data=getUser(user.id);

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("User Reported")
.setDescription(`<@${user.id}> reported`)
.addFields(
{name:"Reason",value:reason},
{name:"Reports",value:`${data.reports}`}
)
.setImage(images.report)
.setFooter({text:DISCLAIMER})
.setColor("Red")
]
});
}

if(cmd==="info"){

const user=interaction.options.getUser("user");
const data=getUser(user.id);

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle(`${user.username}'s Profile`)
.setThumbnail(user.displayAvatarURL())
.addFields(
{name:"Vouches",value:`${data.vouches}`,inline:true},
{name:"Reports",value:`${data.reports}`,inline:true},
{name:"Fake Reports",value:`${data.fakeReports}`,inline:true}
)
.setImage(images.info)
.setFooter({text:DISCLAIMER})
.setColor(0x3498db)
]
});
}

if(cmd==="rep"){

const user=interaction.options.getUser("user");
const data=getUser(user.id);

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("User Reputation")
.setDescription(`<@${user.id}>`)
.addFields(
{name:"Total Vouches",value:`${data.vouches}`}
)
.setImage(images.rep)
.setColor("Blue")
]
});
}

if(cmd==="top"){

const users=db.prepare(`
SELECT userId,vouches FROM users
ORDER BY vouches DESC
LIMIT 10
`).all();

let text="";

users.forEach((u,i)=>{
text+=`${i+1}. <@${u.userId}> — ${u.vouches} vouches\n`;
});

if(text==="") text="No users yet.";

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("🏆 Top Trusted Users")
.setDescription(text)
.setColor("Gold")
]
});
}

if(cmd==="topreports"){

const users=db.prepare(`
SELECT userId,reports FROM users
ORDER BY reports DESC
LIMIT 10
`).all();

let text="";

users.forEach((u,i)=>{
text+=`${i+1}. <@${u.userId}> — ${u.reports} reports\n`;
});

if(text==="") text="No reports yet.";

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("⚠ Most Reported Users")
.setDescription(text)
.setColor("Red")
]
});
}

});

client.login(process.env.TOKEN);
