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
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const DISCLAIMER =
"⚠ This bot does not guarantee trust. Always trade at your own risk.";

const images = {
vouch: "https://media.discordapp.net/attachments/1468414813536518196/1479946564028993687/content.png?ex=69ade324&is=69ac91a4&hm=0080fcd78d34ca9a1623c261bf494f0aff918617b24da88fb694069e3ca98a2a&=&format=webp&quality=lossless&width=1440&height=960",
report: "https://media.discordapp.net/attachments/1468414813536518196/1479946580084658226/content.png?ex=69ade328&is=69ac91a8&hm=fab0be86a7014cafdb768e58069f9aa874ee2b613d35aca2ef0a8ccb5fee9012&=&format=webp&quality=lossless&width=1440&height=960",
info: "https://media.discordapp.net/attachments/1468414813536518196/1479946427168718929/content.png?ex=69ade304&is=69ac9184&hm=b7a3318b9a93f00258184ef9c1199fcfb7f4765aeedddacb51e1b6ef31290ca4&=&format=webp&quality=lossless&width=1440&height=960",
rep: "https://media.discordapp.net/attachments/1468414813536518196/1479946596136259665/content.png?ex=69ade32c&is=69ac91ac&hm=004808584395fb7909404625060268695ead7fcb4df303bd779c9fce9e2b7876&=&format=webp&quality=lossless&width=1440&height=960"
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
PRIMARY KEY (fromUser,toUser)
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

if(data.vouches>20) score+=30;
else if(data.vouches>10) score+=20;
else if(data.vouches>5) score+=10;
else score+=5;

score-=data.reports*10;
score-=data.fakeReports*15;

if(score<0) score=0;
if(score>100) score=100;

return score;

}

function getLogChannel(type,guild){

const row=db.prepare("SELECT channelId FROM logs WHERE type=?").get(type);
if(!row) return null;

return guild.channels.cache.get(row.channelId);

}

const commands=[

new SlashCommandBuilder()
.setName("vouch")
.setDescription("Give a vouch")
.addUserOption(option =>
option.setName("user")
.setDescription("User to vouch")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("rep")
.setDescription("Check reputation")
.addUserOption(option =>
option.setName("user")
.setDescription("User to check")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("report")
.setDescription("Report scammer")
.addUserOption(option =>
option.setName("user")
.setDescription("User to report")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("fakevouch")
.setDescription("Report fake vouch")
.addUserOption(option =>
option.setName("user")
.setDescription("User")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("info")
.setDescription("User info")
.addUserOption(option =>
option.setName("user")
.setDescription("User")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("top")
.setDescription("Top trusted users"),

new SlashCommandBuilder()
.setName("setlog")
.setDescription("Set log channel")
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.addStringOption(option =>
option
.setName("type")
.setDescription("Log type")
.setRequired(true)
.addChoices(
{name:"vouch",value:"vouch"},
{name:"report",value:"report"},
{name:"fake",value:"fake"}
)
)
.addChannelOption(option =>
option
.setName("channel")
.setDescription("Channel")
.setRequired(true)
)

].map(cmd=>cmd.toJSON());

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

db.prepare(`
INSERT OR REPLACE INTO logs VALUES (?,?)
`).run(type,channel.id);

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

const embed=new EmbedBuilder()
.setTitle("🏆 Top Trusted Users")
.setColor("Gold")
.setDescription(text);

return interaction.reply({embeds:[embed]});

}

const user=interaction.options.getUser("user");
const member=await interaction.guild.members.fetch(user.id);

getUser(user.id);

if(interaction.commandName==="vouch"){

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

db.prepare(`INSERT INTO vouchers VALUES (?,?)`)
.run(interaction.user.id,user.id);

const data=getUser(user.id);

const embed=new EmbedBuilder()
.setTitle("Vouch Added")
.setColor("Green")
.setDescription(`<@${user.id}> received a vouch`)
.addFields({name:"Total Vouches",value:`${data.vouches}`})
.setImage(images.vouch)
.setFooter({text:DISCLAIMER});

interaction.reply({embeds:[embed]});

}

if(interaction.commandName==="report"){

if(!isAccountOldEnough(interaction.user))
return interaction.reply({content:"Account must be 5 days old",ephemeral:true});

db.prepare(`UPDATE users SET reports=reports+1 WHERE userId=?`)
.run(user.id);

const data=getUser(user.id);

const embed=new EmbedBuilder()
.setTitle("User Reported")
.setColor("Red")
.setDescription(`<@${user.id}> reported`)
.addFields({name:"Reports",value:`${data.reports}`})
.setImage(images.report)
.setFooter({text:DISCLAIMER});

interaction.reply({embeds:[embed]});

}

if(interaction.commandName==="fakevouch"){

db.prepare(`UPDATE users SET fakeReports=fakeReports+1 WHERE userId=?`)
.run(user.id);

const data=getUser(user.id);

const embed=new EmbedBuilder()
.setTitle("Fake Vouch Report")
.setColor("Orange")
.setDescription(`<@${user.id}> reported for fake vouch`)
.addFields({name:"Fake Reports",value:`${data.fakeReports}`})
.setImage(images.report)
.setFooter({text:DISCLAIMER});

interaction.reply({embeds:[embed]});

}

if(interaction.commandName==="rep"){

const data=getUser(user.id);

const embed=new EmbedBuilder()
.setTitle("User Reputation")
.setColor("Blue")
.setDescription(`<@${user.id}>`)
.addFields({name:"Total Vouches",value:`${data.vouches}`})
.setImage(images.rep)
.setFooter({text:DISCLAIMER});

interaction.reply({embeds:[embed]});

}

if(interaction.commandName==="info"){

const data=getUser(user.id);
const trust=calculateTrust(user,member,data);

let risk="🔴 High Risk";
if(trust>=80) risk="🟢 Low Risk";
else if(trust>=50) risk="🟡 Medium Risk";

const embed=new EmbedBuilder()
.setTitle("User Info")
.setColor(0x3498db)
.setDescription(`<@${user.id}>`)
.addFields(
{name:"Vouches",value:`${data.vouches}`,inline:true},
{name:"Reports",value:`${data.reports}`,inline:true},
{name:"Fake Vouch Reports",value:`${data.fakeReports}`,inline:true},
{name:"Trust Score",value:`${trust}%`,inline:true},
{name:"Risk Level",value:risk,inline:true}
)
.setImage(images.info)
.setFooter({text:DISCLAIMER});

interaction.reply({embeds:[embed]});

}

});

client.login(process.env.TOKEN);
