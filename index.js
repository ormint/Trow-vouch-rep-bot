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

const vouches = new Collection();

const commands = [
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Give a vouch to a user")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User you want to vouch for")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Check a user's reputation")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User whose reputation you want to check")
        .setRequired(true)
    )

].map(command => command.toJSON());

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

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "vouch") {

    const user = interaction.options.getUser("user");

    const count = vouches.get(user.id) || 0;
    vouches.set(user.id, count + 1);

    await interaction.reply(
      `✅ <@${user.id}> has received a vouch! (Total: ${count + 1})`
    );
  }

  if (interaction.commandName === "rep") {

    const user = interaction.options.getUser("user");

    const count = vouches.get(user.id) || 0;

    await interaction.reply(
      `⭐ <@${user.id}>'s reputation: ${count} vouch(es)`
    );
  }

});

client.login(process.env.TOKEN);