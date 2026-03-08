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
vouch:"https://media.discordapp.net/attachments/1468414813536518196/1479946564028993687/content.png?ex=69ade324&is=69ac91a4&hm=0080fcd78d34ca9a1623c261bf494f0aff918617b24da88fb694069e3ca98a2a&=&format=webp&quality=lossless&width=1286&height=858",
report:"https://media.discordapp.net/attachments/1468414813536518196/1479946580084658226/content.png?ex=69ade328&is=69ac91a8&hm=fab0be86a7014cafdb768e58069f9aa874ee2b613d35aca2ef0a8ccb5fee9012&=&format=webp&quality=lossless&width=1286&height=858",
info:"https://media.discordapp.net/attachments/1468414813536518196/1479946427168718929/content.png?ex=69ade304&is=69ac9184&hm=b7a3318b9a93f00258184ef9c1199fcfb7f4765aeedddacb51e1b6ef31290ca4&=&format=webp&quality=lossless&width=1286&height=858",
rep:"https://media.discordapp.net/attachments/1468414813536518196/1479946596136259665/content.png?ex=69ade32c&is=69ac91ac&hm=004808584395fb7909404625060268695ead7fcb4df303bd779c9fce9e2b7876&=&format=webp&quality=lossless&width=1286&height=858"
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
CREATE TABLE IF NOT EXISTS vouchers (
fromUser TEXT,
toUser TEXT,
message TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS reports (
fromUser TEXT,
toUser TEXT,
reason TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS fakeReports (
fromUser TEXT,
toUser TEXT
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

function isAccountOldEnough(user){

const days=(Date.now()-user.createdTimestamp)/(1000*60*60*24);
return days>=5;

}

function calculateTrust(user,member,data){

let score=0;

const accDays=(Date.now()-user.createdTimestamp)/(1000*60*60*24);

if(accDays>365) score+=40;
else if(accDays>180) score+=30;
else if(accDays>30) score+=20;
else score+=10;

const joinDays=(Date.now()-member.joinedTimestamp)/(1000*60*60*24);

if(joinDays>180) score+=30;
else if(joinDays>30) score+=20;
else if(joinDays>7) score+=10;
else score+=5;

score -= data.reports*10;
score -= data.fakeReports*15;

if(score<0) score=0;
if(score>100) score=100;

return score;

}

const commands=[

new SlashCommandBuilder()
.setName("vouch")
.setDescription("Give a vouch")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)
)
.addStringOption(o=>
o.setName("message")
.setDescription("Vouch message")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("report")
.setDescription("Report scammer")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)
)
.addStringOption(o=>
o.setName("reason")
.setDescription("Reason")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("fakevouch")
.setDescription("Report fake vouch")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("info")
.setDescription("User info")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("rep")
.setDescription("Check reputation")
.addUserOption(o=>
o.setName("user")
.setDescription("User")
.setRequired(true)
),

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
{name:"report",value:"report"},
{name:"fake",value:"fake"}
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

client.once("ready",()=>{
console.log(`Bot ready: ${client.user.tag}`);
});

client.on("interactionCreate",async interaction=>{

if(!interaction.isChatInputCommand()) return;

if(interaction.commandName==="setlog"){

const type=interaction.options.getString("type");
const channel=interaction.options.getChannel("channel");

db.prepare(`INSERT OR REPLACE INTO logs VALUES (?,?)`)
.run(type,channel.id);

return interaction.reply(`Log channel set to ${channel}`);

}

if(interaction.commandName==="top"){

const users=db.prepare(`
SELECT userId,vouches FROM users
ORDER BY vouches DESC
LIMIT 10
`).all();

let text="";

users.forEach((u,i)=>{
text+=`${i+1}. <@${u.userId}> — ${u.vouches} vouches\n`;
});

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("🏆 Top Trusted Users")
.setDescription(text)
.setColor("Gold")
]
});

}

if(interaction.commandName==="topreports"){

const users=db.prepare(`
SELECT userId,reports FROM users
ORDER BY reports DESC
LIMIT 10
`).all();

let text="";

users.forEach((u,i)=>{
text+=`${i+1}. <@${u.userId}> — ${u.reports} reports\n`;
});

return interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("⚠ Most Reported Users")
.setDescription(text)
.setColor("Red")
]
});

}

const user=interaction.options.getUser("user");
const member=await interaction.guild.members.fetch(user.id);

getUser(user.id);

if(interaction.commandName==="vouch"){

const message=interaction.options.getString("message");

if(!isAccountOldEnough(interaction.user))
return interaction.reply({content:"Account must be 5 days old",ephemeral:true});

if(user.id===interaction.user.id)
return interaction.reply({content:"You cannot vouch yourself",ephemeral:true});

const already=db.prepare(`
SELECT * FROM vouchers
WHERE fromUser=? AND toUser=?
`).get(interaction.user.id,user.id);

if(already)
return interaction.reply({content:"You already vouched this user",ephemeral:true});

db.prepare(`UPDATE users SET vouches=vouches+1 WHERE userId=?`)
.run(user.id);

db.prepare(`INSERT INTO vouchers VALUES (?,?,?)`)
.run(interaction.user.id,user.id,message);

const data=getUser(user.id);

interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("Vouch Added")
.setDescription(`<@${user.id}> received a vouch`)
.addFields(
{name:"Message",value:message},
{name:"Total Vouches",value:`${data.vouches}`}
)
.setThumbnail(user.displayAvatarURL({dynamic:true}))
.setImage(images.vouch)
.setFooter({text:DISCLAIMER})
.setColor("Green")
]
});

const log=getLogChannel("vouch",interaction.guild);

if(log){

log.send({
embeds:[
new EmbedBuilder()
.setTitle("Vouch Log")
.addFields(
{name:"User",value:`<@${interaction.user.id}>`,inline:true},
{name:"Target",value:`<@${user.id}>`,inline:true},
{name:"Message",value:message}
)
.setTimestamp()
.setColor("Green")
]
});

}

}

if(interaction.commandName==="report"){

const reason=interaction.options.getString("reason");

if(!isAccountOldEnough(interaction.user))
return interaction.reply({content:"Account must be 5 days old",ephemeral:true});

db.prepare(`UPDATE users SET reports=reports+1 WHERE userId=?`)
.run(user.id);

db.prepare(`INSERT INTO reports VALUES (?,?,?)`)
.run(interaction.user.id,user.id,reason);

const data=getUser(user.id);

interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle("User Reported")
.setDescription(`<@${user.id}> reported`)
.addFields(
{name:"Reason",value:reason},
{name:"Reports",value:`${data.reports}`}
)
.setThumbnail(user.displayAvatarURL({dynamic:true}))
.setImage(images.report)
.setFooter({text:DISCLAIMER})
.setColor("Red")
]
});

const log=getLogChannel("report",interaction.guild);

if(log){

log.send({
embeds:[
new EmbedBuilder()
.setTitle("Report Log")
.addFields(
{name:"Reporter",value:`<@${interaction.user.id}>`,inline:true},
{name:"Target",value:`<@${user.id}>`,inline:true},
{name:"Reason",value:reason}
)
.setTimestamp()
.setColor("Red")
]
});

}

}

if(interaction.commandName==="info"){

const data=getUser(user.id);
const trust=calculateTrust(user,member,data);

let risk="🔴 High Risk";
if(trust>=80) risk="🟢 Low Risk";
else if(trust>=50) risk="🟡 Medium Risk";

if(data.reports>=50 && data.vouches<50)
risk="🚨 Potential Scammer";

const created=`<t:${Math.floor(user.createdTimestamp/1000)}:R>`;
const joined=`<t:${Math.floor(member.joinedTimestamp/1000)}:R>`;

interaction.reply({
embeds:[
new EmbedBuilder()
.setTitle(`${user.username}'s Profile`)
.setThumbnail(user.displayAvatarURL({dynamic:true}))
.setDescription(`<@${user.id}>`)
.addFields(
{name:"Account Created",value:created,inline:true},
{name:"Joined Server",value:joined,inline:true},
{name:"Vouches",value:`${data.vouches}`,inline:true},
{name:"Reports",value:`${data.reports}`,inline:true},
{name:"Fake Vouch Reports",value:`${data.fakeReports}`,inline:true},
{name:"Trust Score",value:`${trust}%`,inline:true},
{name:"Risk Level",value:risk,inline:true}
)
.setImage(images.info)
.setFooter({text:DISCLAIMER})
.setColor(0x3498db)
]
});

}

});

client.login(process.env.TOKEN);
