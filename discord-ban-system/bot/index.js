require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const https = require("https");
const http  = require("http");

const API_BASE   = process.env.API_URL || `http://localhost:${process.env.API_PORT || 3000}`;
const API_URL    = `${API_BASE}/api`;
const API_SECRET = process.env.API_SECRET;

function callApi(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + endpoint);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_SECRET}`,
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
      }
    };
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error("JSON parse error: " + data)); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder().setName("bansite").setDescription("Bannir un utilisateur du site")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("unbansite").setDescription("Débannir un utilisateur du site")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("ratelimited").setDescription("Ratelimiter un utilisateur (48h)")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("unrate").setDescription("Retirer le ratelimit")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("changekey").setDescription("Permet à un utilisateur de changer sa key")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("repairkey").setDescription("Répare/réinitialise la key d'un utilisateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
].map(c => c.toJSON());

async function callApi(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_SECRET}` }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetchFn(`${API_URL}${endpoint}`, opts);
  return res.json();
}

client.once("ready", async () => {
  console.log(`🤖 Bot connecté : ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Commandes slash enregistrées.");
  } catch (e) { console.error(e); }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const id = interaction.options.getString("id");
  const by = interaction.user.tag;
  await interaction.deferReply({ ephemeral: true });

  try {
    let data;
    switch (interaction.commandName) {
      case "bansite":
        data = await callApi("POST", `/ban/${id}`, { by });
        await interaction.editReply(data.success ? `✅ **${id}** banni du site.` : `❌ ${data.error}`);
        break;
      case "unbansite":
        data = await callApi("POST", `/unban/${id}`, { by });
        await interaction.editReply(data.success ? `✅ **${id}** débanni.` : `❌ ${data.error}`);
        break;
      case "ratelimited":
        data = await callApi("POST", `/ratelimit/${id}`, { by });
        await interaction.editReply(data.success
          ? `⏱️ **${id}** ratelimité jusqu'au **${new Date(data.until).toLocaleString("fr-FR")}**.`
          : `❌ ${data.error}`);
        break;
      case "unrate":
        data = await callApi("POST", `/unratelimit/${id}`, { by });
        await interaction.editReply(data.success ? `✅ Ratelimit retiré pour **${id}**.` : `❌ ${data.error}`);
        break;
      case "changekey":
      case "repairkey":
        data = await callApi("POST", `/keys/reset/${id}`);
        await interaction.editReply(data.success
          ? `🔑 Key réinitialisée pour **${id}**. Il peut en générer une nouvelle sur le site.`
          : `❌ ${data.error}`);
        break;
    }
  } catch (e) {
    console.error("Erreur API:", e.message, e.cause || "");
    await interaction.editReply(`❌ Impossible de contacter l'API. (${e.message})`);
  }
});

client.login(process.env.DISCORD_TOKEN);
