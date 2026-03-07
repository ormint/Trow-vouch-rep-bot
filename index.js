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
  vouch: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-a0dc-7246-8273-a313b12473d3/raw?se=2026-03-07T21:19:20Z&sp=r&sv=2026-02-06&sr=b&scid=d54849ed-34c6-40cf-9f63-ec9728116b54&skoid=b32d65cd-c8f1-46fb-90df-c208671889d4&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-03-07T06:41:28Z&ske=2026-03-08T06:41:28Z&sks=b&skv=2026-02-06&sig=cJnG8Pk%2B5jc8iHblqlWam3xwQ%2BXudKZy6PEra6ALL6g%3D"
  report: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-c0a8-7246-be69-59612575dea0/raw?se=2026-03-07T21:21:59Z&sp=r&sv=2026-02-06&sr=b&scid=3316db01-08a4-481d-8bb1-e04097909541&skoid=b32d65cd-c8f1-46fb-90df-c208671889d4&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-03-07T20:58:40Z&ske=2026-03-08T20:58:40Z&sks=b&skv=2026-02-06&sig=tsZChvzNbjuBSKeCvVK8qvjlYqTai3PWkRAcSYfjtpc%3D"
  info: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-bf20-7246-9ed2-27af54dc24f4/raw?se=2026-03-07T21:18:19Z&sp=r&sv=2026-02-06&sr=b&scid=538b6fa6-b33b-414f-96ef-cdc7d1841b4d&skoid=b32d65cd-c8f1-46fb-90df-c208671889d4&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-03-07T07:13:03Z&ske=2026-03-08T07:13:03Z&sks=b&skv=2026-02-06&sig=tkuaiOegn6TvMWg0NjKSHa5J9DljMEaXSMJJDpwPWUw%3D"
  rep: "https://sdmntpritalynorth.oaiusercontent.com/files/00000000-8818-7246-84a5-4364d35d6d60/raw?se=2026-03-07T21:22:23Z&sp=r&sv=2026-02-06&sr=b&scid=27663fb6-1b3a-4c52-9de3-b2524665860b&skoid=b32d65cd-c8f1-46fb-90df-c208671889d4&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-03-07T06:59:54Z&ske=2026-03-08T06:59:54Z&sks=b&skv=2026-02-06&sig=4SwpuV8IJ9E%2BBiyjwpmo4Ndwv4FKT4%2BZxITjonVCD6c%3D"
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


