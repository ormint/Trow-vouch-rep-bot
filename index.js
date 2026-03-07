require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  Collection,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const vouches = new Collection();
const reports = new Collection();
const fakeReports = new Collection();

const images = {
  vouch: "https://media.discordapp.net/attachments/1468414813536518196/1479946564028993687/content.png?ex=69ade324&is=69ac91a4&hm=0080fcd78d34ca9a1623c261bf494f0aff918617b24da88fb694069e3ca98a2a&=&format=webp&quality=lossless&width=1440&height=960",
  report: "https://media.discordapp.net/attachments/1468414813536518196/1479946580084658226/content.png?ex=69ade328&is=69ac91a8&hm=fab0be86a7014cafdb768e58069f9aa874ee2b613d35aca2ef0a8ccb5fee9012&=&format=webp&quality=lossless&width=1440&height=960",
  info: "https://media.discordapp.net/attachments/1468414813536518196/1479946427168718929/content.png?ex=69ade304&is=69ac9184&hm=b7a3318b9a93f00258184ef9c1199fcfb7f4765aeedddacb51e1b6ef31290ca4&=&format=webp&quality=lossless&width=1440&height=960",
  rep: "https://media.discordapp.net/attachments/1468414813536518196/1479946596136259665/content.png?ex=69ade32c&is=69ac91ac&hm=004808584395fb7909404625060268695ead7fcb4df303bd779c9fce9e2b7876&=&format=webp&quality=lossless&width=1440&height=960"
};

const commands = [
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Give a vouch")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Check reputation")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a scammer")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("fakevouch")
    .setDescription("Report fake vouch")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("info")
    .setDescription("User info")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(true)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {

    console.log("Loading commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("Commands loaded.");

  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`Bot ready: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const user = interaction.options.getUser("user");

  if (interaction.commandName === "vouch") {

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: "❌ You cannot vouch yourself.", ephemeral: true });
    }

    const key = `${interaction.user.id}-${user.id}`;

    if (vouches.has(key)) {
      return interaction.reply({ content: "⚠️ You already vouched this user.", ephemeral: true });
    }

    vouches.set(key, true);

    const count = [...vouches.keys()].filter(k => k.endsWith(user.id)).length;

    const embed = new EmbedBuilder()
      .setTitle("Vouch Added")
      .setColor(0x00ff88)
      .setDescription(`<@${user.id}> received a vouch!`)
      .addFields({ name: "Total Vouches", value: `${count}` })
      .setImage(images.vouch);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "rep") {

    const count = [...vouches.keys()].filter(k => k.endsWith(user.id)).length;

    const embed = new EmbedBuilder()
      .setTitle("User Reputation")
      .setColor(0x00ffff)
      .setDescription(`<@${user.id}> reputation`)
      .addFields({ name: "Total Vouches", value: `${count}` })
      .setImage(images.rep);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "report") {

    const key = `${interaction.user.id}-${user.id}`;

    if (reports.has(key)) {
      return interaction.reply({ content: "⚠️ You already reported this user.", ephemeral: true });
    }

    reports.set(key, true);

    const count = [...reports.keys()].filter(k => k.endsWith(user.id)).length;

    const embed = new EmbedBuilder()
      .setTitle("User Reported")
      .setColor(0xff0000)
      .setDescription(`<@${user.id}> reported as scammer`)
      .addFields({ name: "Reports", value: `${count}` })
      .setImage(images.report);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "fakevouch") {

    const key = `${interaction.user.id}-${user.id}`;

    if (fakeReports.has(key)) {
      return interaction.reply({ content: "⚠️ Already reported fake vouch.", ephemeral: true });
    }

    fakeReports.set(key, true);

    const count = [...fakeReports.keys()].filter(k => k.endsWith(user.id)).length;

    const embed = new EmbedBuilder()
      .setTitle("Fake Vouch Report")
      .setColor(0xff9900)
      .setDescription(`<@${user.id}> reported for fake vouch`)
      .addFields({ name: "Fake Vouch Report", value: `${count}` })
      .setImage(images.report);

    interaction.reply({ embeds: [embed] });

  }

  if (interaction.commandName === "info") {

    const vouchCount = [...vouches.keys()].filter(k => k.endsWith(user.id)).length;
    const reportCount = [...reports.keys()].filter(k => k.endsWith(user.id)).length;
    const fakeCount = [...fakeReports.keys()].filter(k => k.endsWith(user.id)).length;

    const embed = new EmbedBuilder()
      .setTitle("User Info")
      .setColor(0x3498db)
      .setDescription(`<@${user.id}>`)
      .addFields(
        { name: "Vouches", value: `${vouchCount}`, inline: true },
        { name: "Reports", value: `${reportCount}`, inline: true },
        { name: "Fake Vouch Report", value: `${fakeCount}`, inline: true }
      )
      .setImage(images.info);

    interaction.reply({ embeds: [embed] });

  }

});

client.login(process.env.TOKEN);
