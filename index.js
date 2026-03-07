require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const Database = require("better-sqlite3");
const db = new Database("database.db");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

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
  fakeReports INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0
)
`).run();

function getUser(id) {

  let user = db.prepare("SELECT * FROM users WHERE userId = ?").get(id);

  if (!user) {

    db.prepare(`
    INSERT INTO users (userId)
    VALUES (?)
    `).run(id);

    user = db.prepare("SELECT * FROM users WHERE userId = ?").get(id);

  }

  return user;
}

const commands = [

  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Give a vouch")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Check reputation")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report scammer")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("fakevouch")
    .setDescription("Report fake vouch")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("info")
    .setDescription("User info")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

})();

client.once("ready", () => {
  console.log(`Bot ready: ${client.user.tag}`);
});

client.on("messageCreate", message => {

  if (message.author.bot) return;

  getUser(message.author.id);

  db.prepare(`
  UPDATE users
  SET messages = messages + 1
  WHERE userId = ?
  `).run(message.author.id);

});

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const user = interaction.options.getUser("user");

  getUser(user.id);

  if (interaction.commandName === "vouch") {

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: "❌ You cannot vouch yourself.", ephemeral: true });
    }

    db.prepare(`
    UPDATE users
    SET vouches = vouches + 1
    WHERE userId = ?
    `).run(user.id);

    const data = getUser(user.id);

    const embed = new EmbedBuilder()
      .setTitle("Vouch Added")
      .setColor("Green")
      .setDescription(`<@${user.id}> received a vouch`)
      .addFields({ name: "Total Vouches", value: `${data.vouches}` })
      .setImage(images.vouch);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "rep") {

    const data = getUser(user.id);

    const embed = new EmbedBuilder()
      .setTitle("User Reputation")
      .setColor("Blue")
      .setDescription(`<@${user.id}>`)
      .addFields({ name: "Total Vouches", value: `${data.vouches}` })
      .setImage(images.rep);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "report") {

    db.prepare(`
    UPDATE users
    SET reports = reports + 1
    WHERE userId = ?
    `).run(user.id);

    const data = getUser(user.id);

    const embed = new EmbedBuilder()
      .setTitle("User Reported")
      .setColor("Red")
      .setDescription(`<@${user.id}> reported`)
      .addFields({ name: "Reports", value: `${data.reports}` })
      .setImage(images.report);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "fakevouch") {

    db.prepare(`
    UPDATE users
    SET fakeReports = fakeReports + 1
    WHERE userId = ?
    `).run(user.id);

    const data = getUser(user.id);

    const embed = new EmbedBuilder()
      .setTitle("Fake Vouch Report")
      .setColor("Orange")
      .setDescription(`<@${user.id}> reported for fake vouch`)
      .addFields({ name: "Fake Vouch Report", value: `${data.fakeReports}` })
      .setImage(images.report);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "info") {

    const data = getUser(user.id);

    const embed = new EmbedBuilder()
      .setTitle("User Info")
      .setColor("Purple")
      .setDescription(`<@${user.id}>`)
      .addFields(
        { name: "Vouches", value: `${data.vouches}`, inline: true },
        { name: "Reports", value: `${data.reports}`, inline: true },
        { name: "Fake Vouch Report", value: `${data.fakeReports}`, inline: true },
        { name: "Messages", value: `${data.messages}`, inline: true }
      )
      .setImage(images.info);

    interaction.reply({ embeds: [embed] });

  }

});

client.login(process.env.TOKEN);
