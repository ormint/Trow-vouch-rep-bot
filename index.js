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
  vouch: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-a0dc-7246-8273-a313b12473d3/raw",
  report: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-c0a8-7246-be69-59612575dea0/raw",
  info: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-bf20-7246-9ed2-27af54dc24f4/raw",
  rep: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-8818-7246-84a5-4364d35d6d60/raw"
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
