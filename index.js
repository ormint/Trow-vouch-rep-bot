require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  Collection
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Storage
const vouches = new Collection();     // key: giverId-targetId
const reports = new Collection();     // key: reporterId-targetId
const fakeReports = new Collection(); // key: reporterId-targetId

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Give a vouch to a user")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User you want to vouch for")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Check a user's reputation")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User whose reputation you want to check")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a scammer")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User you want to report")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("fakevouch")
    .setDescription("Report fake vouch activity")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User you want to report for fake vouch")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

// Register slash commands
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Loading slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("Commands loaded successfully.");
  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`Bot is ready: ${client.user.tag}`);
});

// Interaction handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  // ===== VOUCH =====
  if (command === "vouch") {

    const user = interaction.options.getUser("user");
    const giver = interaction.user;

    if (user.id === giver.id) {
      return interaction.reply({
        content: "❌ You cannot vouch for yourself.",
        ephemeral: true
      });
    }

    const key = `${giver.id}-${user.id}`;

    if (vouches.has(key)) {
      return interaction.reply({
        content: "⚠️ You already vouched for this user.",
        ephemeral: true
      });
    }

    vouches.set(key, true);

    const count = [...vouches.keys()].filter(k => k.endsWith(user.id)).length;

    await interaction.reply(
      `✅ <@${user.id}> has received a vouch! (Total: ${count})`
    );
  }

  // ===== REP =====
  if (command === "rep") {

    const user = interaction.options.getUser("user");

    const count = [...vouches.keys()].filter(k => k.endsWith(user.id)).length;

    await interaction.reply(
      `⭐ <@${user.id}>'s reputation: ${count} vouch(es)`
    );
  }

  // ===== SCAM REPORT =====
  if (command === "report") {

    const user = interaction.options.getUser("user");
    const reporter = interaction.user;

    if (user.id === reporter.id) {
      return interaction.reply({
        content: "❌ You cannot report yourself.",
        ephemeral: true
      });
    }

    const key = `${reporter.id}-${user.id}`;

    if (reports.has(key)) {
      return interaction.reply({
        content: "⚠️ You already reported this user.",
        ephemeral: true
      });
    }

    reports.set(key, true);

    const count = [...reports.keys()].filter(k => k.endsWith(user.id)).length;

    await interaction.reply(
      `⚠️ <@${user.id}> has been reported as a scammer. (Reports: ${count})`
    );
  }

  // ===== FAKE VOUCH REPORT =====
  if (command === "fakevouch") {

    const user = interaction.options.getUser("user");
    const reporter = interaction.user;

    if (user.id === reporter.id) {
      return interaction.reply({
        content: "❌ You cannot report yourself.",
        ephemeral: true
      });
    }

    const key = `${reporter.id}-${user.id}`;

    if (fakeReports.has(key)) {
      return interaction.reply({
        content: "⚠️ You already reported fake vouch for this user.",
        ephemeral: true
      });
    }

    fakeReports.set(key, true);

    const count = [...fakeReports.keys()].filter(k => k.endsWith(user.id)).length;

    await interaction.reply(
      `🚨 <@${user.id}> has been reported for fake vouch activity. (Reports: ${count})`
    );
  }

});

client.login(process.env.TOKEN);
