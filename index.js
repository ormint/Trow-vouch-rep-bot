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

function getUser(id){

let user=db.prepare("SELECT * FROM users WHERE userId=?").get(id);

if(!user){
db.prepare("INSERT INTO users (userId) VALUES (?)").run(id);
user=db.prepare("SELECT * FROM users WHERE userId=?").get(id);
}

return user;

}

const commands=[

new SlashCommandBuilder()
.setName("help")
.setDescription("Show Divine commands"),

new SlashCommandBuilder()
.setName("vouch")
.setDescription("Give a vouch")
.addUserOption(option=>
option.setName("user")
.setDescription("User to vouch")
.setRequired(true)
)
.addStringOption(option=>
option.setName("message")
.setDescription("Vouch message")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("report")
.setDescription("Report scammer")
.addUserOption(option=>
option.setName("user")
.setDescription("User to report")
.setRequired(true)
)
.addStringOption(option=>
option.setName("reason")
.setDescription("Reason for report")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("fakevouch")
.setDescription("Report fake vouch")
.addUserOption(option=>
option.setName("user")
.setDescription("User with fake vouch")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("rep")
.setDescription("Check user reputation")
.addUserOption(option=>
option.setName("user")
.setDescription("User to check")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("info")
.setDescription("Show user info")
.addUserOption(option=>
option.setName("user")
.setDescription("User to show")
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
.addStringOption(option=>
option.setName("type")
.setDescription("Log type")
.setRequired(true)
.addChoices(
{name:"vouch",value:"vouch"},
{name:"report",value:"report"}
)
)
.addChannelOption(option=>
option.setName("channel")
.setDescription("Channel")
.setRequired(true)
)

].map(c=>c.toJSON());

const rest=new REST({version:"10"}).setToken(process.env.TOKEN);

(async()=>{

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{body:commands}
);

})();

client.once("ready",()=>{
console.log(`Divine bot ready: ${client.user.tag}`);
});

client.on("interactionCreate",async interaction=>{

if(!interaction.isChatInputCommand()) return;

await interaction.deferReply();

const cmd=interaction.commandName;

if(cmd==="help"){

return interaction.editReply({
embeds:[
new EmbedBuilder()
.setTitle("✨ Divine Trust Bot")
.setDescription("Available commands")
.addFields(
{name:"/vouch user message",value:"Give vouch after trade"},
{name:"/report user reason",value:"Report scammer"},
{name:"/fakevouch user",value:"Report fake vouch"},
{name:"/rep user",value:"Check reputation"},
{name:"/info user",value:"User profile"},
{name:"/top",value:"Top trusted users"},
{name:"/topreports",value:"Most reported users"},
{name:"/setlog",value:"Set log channels"}
)
.setColor(0x5865F2)
]
});

}

if(cmd==="setlog"){

const type=interaction.options.getString("type");
const channel=interaction.options.getChannel("channel");

return interaction.editReply(`Log channel set to ${channel}`);

}

const user=interaction.options.getUser("user");

if(cmd==="vouch"){

const message=interaction.options.getString("message");

const data=getUser(user.id);

db.prepare(`UPDATE users SET vouches=vouches+1 WHERE userId=?`)
.run(user.id);

return interaction.editReply({
embeds:[
new EmbedBuilder()
.setTitle("Vouch Added")
.setDescription(`<@${user.id}> received a vouch`)
.addFields(
{name:"Message",value:message},
{name:"Total Vouches",value:`${data.vouches+1}`}
)
.setImage(images.vouch)
.setFooter({text:DISCLAIMER})
.setColor("Green")
]
});

}

if(cmd==="report"){

const reason=interaction.options.getString("reason");

const data=getUser(user.id);

db.prepare(`UPDATE users SET reports=reports+1 WHERE userId=?`)
.run(user.id);

return interaction.editReply({
embeds:[
new EmbedBuilder()
.setTitle("User Reported")
.setDescription(`<@${user.id}> reported`)
.addFields(
{name:"Reason",value:reason},
{name:"Reports",value:`${data.reports+1}`}
)
.setImage(images.report)
.setFooter({text:DISCLAIMER})
.setColor("Red")
]
});

}

if(cmd==="fakevouch"){

const data=getUser(user.id);

db.prepare(`UPDATE users SET fakeReports=fakeReports+1 WHERE userId=?`)
.run(user.id);

return interaction.editReply({
embeds:[
new EmbedBuilder()
.setTitle("Fake Vouch Report")
.setDescription(`<@${user.id}> reported`)
.addFields(
{name:"Fake Reports",value:`${data.fakeReports+1}`}
)
.setColor("Orange")
]
});

}

if(cmd==="rep"){

const data=getUser(user.id);

return interaction.editReply({
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

if(cmd==="info"){

const data=getUser(user.id);

return interaction.editReply({
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
.setColor(0x3498db)
.setFooter({text:DISCLAIMER})
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

return interaction.editReply({
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

return interaction.editReply({
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
