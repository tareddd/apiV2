require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const https = require("https");
const http  = require("http");

const API_BASE   = process.env.API_URL || `http://localhost:${process.env.API_PORT || 3000}`;
const API_SECRET = process.env.API_SECRET;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function callApi(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + "/api" + endpoint);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_SECRET,
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
      }
    };
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error("Parse error: " + data)); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const commands = [
  // Commandes de bannissement existantes
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
  new SlashCommandBuilder().setName("unlock").setDescription("Débloquer l'accès d'un utilisateur après paiement")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),

  // Commandes de gestion des clés
  new SlashCommandBuilder().setName("generatekey").setDescription("Générer une nouvelle clé pour un utilisateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Durée (days/weeks/months)").setRequired(false)),
  new SlashCommandBuilder().setName("revokekey").setDescription("Révoquer la clé d'un utilisateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("extendkey").setDescription("Prolonger la durée d'une clé")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true))
    .addStringOption(o => o.setName("days").setDescription("Nombre de jours à ajouter").setRequired(true)),
  new SlashCommandBuilder().setName("upgradekey").setDescription("Mettre à niveau le type de clé")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("Nouveau type de clé").setRequired(true)),
  new SlashCommandBuilder().setName("getkey").setDescription("Obtenir la clé d'un utilisateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("checkkey").setDescription("Vérifier le statut d'une clé")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("listkeys").setDescription("Lister toutes les clés actives"),
  new SlashCommandBuilder().setName("expirekey").setDescription("Faire expirer une clé manuellement")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("suspendkey").setDescription("Suspendre temporairement une clé")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Durée de suspension (hours)").setRequired(true)),
  new SlashCommandBuilder().setName("reactivatekey").setDescription("Réactiver une clé suspendue")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("transferkey").setDescription("Transférer une clé vers un autre utilisateur")
    .addStringOption(o => o.setName("from_id").setDescription("ID Discord source").setRequired(true))
    .addStringOption(o => o.setName("to_id").setDescription("ID Discord destination").setRequired(true)),
  new SlashCommandBuilder().setName("duplicatekey").setDescription("Dupliquer une clé pour un autre utilisateur")
    .addStringOption(o => o.setName("source_id").setDescription("ID Discord source").setRequired(true))
    .addStringOption(o => o.setName("target_id").setDescription("ID Discord cible").setRequired(true)),

  // Commandes de statut et informations
  new SlashCommandBuilder().setName("userstatus").setDescription("Vérifier le statut complet d'un utilisateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("keyinfo").setDescription("Informations détaillées sur une clé")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("banstatus").setDescription("Vérifier le statut de bannissement")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("ratelimitstatus").setDescription("Vérifier le statut de rate limit")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("activestatus").setDescription("Vérifier le statut d'activité")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("subscriptionstatus").setDescription("Vérifier le statut d'abonnement")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("usagestats").setDescription("Statistiques d'utilisation d'un utilisateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("keyhistory").setDescription("Historique des clés d'un utilisateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("loginhistory").setDescription("Historique des connexions")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("paymentstatus").setDescription("Vérifier le statut de paiement")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),

  // Commandes d'administration avancées
  new SlashCommandBuilder().setName("massban").setDescription("Bannir plusieurs utilisateurs")
    .addStringOption(o => o.setName("ids").setDescription("IDs Discord séparés par des virgules").setRequired(true)),
  new SlashCommandBuilder().setName("massunban").setDescription("Débannir plusieurs utilisateurs")
    .addStringOption(o => o.setName("ids").setDescription("IDs Discord séparés par des virgules").setRequired(true)),
  new SlashCommandBuilder().setName("masskeyreset").setDescription("Réinitialiser plusieurs clés")
    .addStringOption(o => o.setName("ids").setDescription("IDs Discord séparés par des virgules").setRequired(true)),
  new SlashCommandBuilder().setName("clearexpiredkeys").setDescription("Nettoyer toutes les clés expirées"),
  new SlashCommandBuilder().setName("clearsuspendedkeys").setDescription("Nettoyer toutes les clés suspendues"),
  new SlashCommandBuilder().setName("backupkeys").setDescription("Créer une sauvegarde de toutes les clés"),
  new SlashCommandBuilder().setName("restorekeys").setDescription("Restaurer les clés depuis une sauvegarde")
    .addStringOption(o => o.setName("backup_id").setDescription("ID de la sauvegarde").setRequired(true)),
  new SlashCommandBuilder().setName("exportkeys").setDescription("Exporter la liste des clés en CSV"),
  new SlashCommandBuilder().setName("importkeys").setDescription("Importer des clés depuis un fichier CSV")
    .addAttachmentOption(o => o.setName("file").setDescription("Fichier CSV des clés").setRequired(true)),

  // Commandes de monitoring et rapports
  new SlashCommandBuilder().setName("serverstats").setDescription("Statistiques générales du serveur"),
  new SlashCommandBuilder().setName("keystats").setDescription("Statistiques des clés"),
  new SlashCommandBuilder().setName("banstats").setDescription("Statistiques des bannissements"),
  new SlashCommandBuilder().setName("activestats").setDescription("Statistiques d'activité"),
  new SlashCommandBuilder().setName("dailystats").setDescription("Statistiques quotidiennes"),
  new SlashCommandBuilder().setName("weeklystats").setDescription("Statistiques hebdomadaires"),
  new SlashCommandBuilder().setName("monthlystats").setDescription("Statistiques mensuelles"),
  new SlashCommandBuilder().setName("topusers").setDescription("Utilisateurs les plus actifs")
    .addIntegerOption(o => o.setName("limit").setDescription("Nombre d'utilisateurs à afficher").setRequired(false)),
  new SlashCommandBuilder().setName("newusers").setDescription("Nouveaux utilisateurs récents")
    .addIntegerOption(o => o.setName("days").setDescription("Nombre de jours").setRequired(false)),
  new SlashCommandBuilder().setName("expiringkeys").setDescription("Clés qui expirent bientôt")
    .addIntegerOption(o => o.setName("days").setDescription("Jours avant expiration").setRequired(false)),

  // Commandes de gestion des permissions
  new SlashCommandBuilder().setName("giveadmin").setDescription("Donner les droits admin")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("removeadmin").setDescription("Retirer les droits admin")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("givemod").setDescription("Donner les droits modérateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("removemod").setDescription("Retirer les droits modérateur")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("givevip").setDescription("Donner le statut VIP")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true))
    .addIntegerOption(o => o.setName("duration").setDescription("Durée en jours").setRequired(false)),
  new SlashCommandBuilder().setName("removevip").setDescription("Retirer le statut VIP")
    .addStringOption(o => o.setName("id").setDescription("ID Discord").setRequired(true)),

  // Commandes utilitaires
  new SlashCommandBuilder().setName("searchuser").setDescription("Rechercher un utilisateur")
    .addStringOption(o => o.setName("query").setDescription("Nom ou ID Discord").setRequired(true)),
  new SlashCommandBuilder().setName("findbykey").setDescription("Trouver un utilisateur par sa clé")
    .addStringOption(o => o.setName("key").setDescription("Clé à rechercher").setRequired(true)),
  new SlashCommandBuilder().setName("validatekey").setDescription("Valider le format d'une clé")
    .addStringOption(o => o.setName("key").setDescription("Clé à valider").setRequired(true)),
  new SlashCommandBuilder().setName("systemhealth").setDescription("Vérifier la santé du système"),
  new SlashCommandBuilder().setName("apistatus").setDescription("Vérifier le statut de l'API"),
  new SlashCommandBuilder().setName("botinfo").setDescription("Informations sur le bot"),
  new SlashCommandBuilder().setName("help").setDescription("Afficher l'aide des commandes")
    .addStringOption(o => o.setName("command").setDescription("Commande spécifique").setRequired(false)),
].map(c => c.toJSON());

client.once("ready", async () => {
  console.log("Bot connecte : " + client.user.tag);
  console.log("API_BASE: " + API_BASE);
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Commandes slash enregistrees.");
  } catch (e) { console.error(e); }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const by = interaction.user.tag;
  await interaction.deferReply({ ephemeral: true });

  try {
    let data;
    const commandName = interaction.commandName;

    // Commandes de bannissement existantes
    if (["bansite", "unbansite", "ratelimited", "unrate", "changekey", "repairkey", "unlock"].includes(commandName)) {
      const id = interaction.options.getString("id");
      switch (commandName) {
        case "bansite":
          data = await callApi("POST", `/ban/${id}`, { by });
          console.log(`Réponse API bansite pour ${id}:`, JSON.stringify(data, null, 2));
          await interaction.editReply(data.success ? `✅ Banni : ${id}` : `❌ Erreur : ${data.error || 'Erreur inconnue'}`);
          break;
        case "unbansite":
          data = await callApi("POST", `/unban/${id}`, { by });
          await interaction.editReply(data.success ? `✅ Débanni : ${id}` : `❌ Erreur : ${data.error || 'Erreur inconnue'}`);
          break;
        case "ratelimited":
          data = await callApi("POST", `/ratelimit/${id}`, { by });
          await interaction.editReply(data.success ? `✅ Ratelimite : ${id}` : `❌ Erreur : ${data.error || 'Erreur inconnue'}`);
          break;
        case "unrate":
          data = await callApi("POST", `/unratelimit/${id}`, { by });
          await interaction.editReply(data.success ? `✅ Ratelimit retire : ${id}` : `❌ Erreur : ${data.error || 'Erreur inconnue'}`);
          break;
        case "changekey":
        case "repairkey":
          data = await callApi("POST", `/keys/reset/${id}`);
          await interaction.editReply(data.success ? `✅ Key reset : ${id}` : `❌ Erreur : ${data.error || 'Erreur inconnue'}`);
          break;
        case "unlock":
          data = await callApi("POST", `/unlock/${id}`, { by });
          await interaction.editReply(data.success ? `✅ Accès débloqué pour : ${id}` : `❌ Erreur : ${data.error || 'Erreur inconnue'}`);
          break;
      }
    }

    // Commandes de gestion des clés
    else if (["generatekey", "revokekey", "extendkey", "upgradekey", "getkey", "checkkey", "listkeys", "expirekey", "suspendkey", "reactivatekey", "transferkey", "duplicatekey"].includes(commandName)) {
      switch (commandName) {
        case "generatekey":
          const id = interaction.options.getString("id");
          const duration = interaction.options.getString("duration") || "30d";
          data = await callApi("POST", `/keys/generate/${id}`, { duration, by });
          await interaction.editReply(data.success ? `✅ Clé générée pour ${id}: ${data.key}` : `❌ Erreur : ${data.error}`);
          break;
        case "revokekey":
          const revokeId = interaction.options.getString("id");
          data = await callApi("DELETE", `/keys/${revokeId}`, { by });
          await interaction.editReply(data.success ? `✅ Clé révoquée : ${revokeId}` : `❌ Erreur : ${data.error}`);
          break;
        case "extendkey":
          const extendId = interaction.options.getString("id");
          const days = interaction.options.getString("days");
          data = await callApi("POST", `/keys/extend/${extendId}`, { days, by });
          await interaction.editReply(data.success ? `✅ Clé prolongée de ${days} jours : ${extendId}` : `❌ Erreur : ${data.error}`);
          break;
        case "upgradekey":
          const upgradeId = interaction.options.getString("id");
          const type = interaction.options.getString("type");
          data = await callApi("POST", `/keys/upgrade/${upgradeId}`, { type, by });
          await interaction.editReply(data.success ? `✅ Clé mise à niveau vers ${type} : ${upgradeId}` : `❌ Erreur : ${data.error}`);
          break;
        case "getkey":
          const getId = interaction.options.getString("id");
          data = await callApi("GET", `/keys/${getId}`);
          await interaction.editReply(data.success ? `🔑 Clé de ${getId}: ${data.key}` : `❌ Erreur : ${data.error}`);
          break;
        case "checkkey":
          const checkId = interaction.options.getString("id");
          data = await callApi("GET", `/keys/status/${checkId}`);
          await interaction.editReply(data.success ? `📊 Statut clé ${checkId}: ${JSON.stringify(data.status, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "listkeys":
          data = await callApi("GET", "/keys");
          await interaction.editReply(data.success ? `📋 Clés actives: ${data.keys.length} clés trouvées` : `❌ Erreur : ${data.error}`);
          break;
        case "expirekey":
          const expireId = interaction.options.getString("id");
          data = await callApi("POST", `/keys/expire/${expireId}`, { by });
          await interaction.editReply(data.success ? `⏰ Clé expirée manuellement : ${expireId}` : `❌ Erreur : ${data.error}`);
          break;
        case "suspendkey":
          const suspendId = interaction.options.getString("id");
          const suspendDuration = interaction.options.getString("duration");
          data = await callApi("POST", `/keys/suspend/${suspendId}`, { duration: suspendDuration, by });
          await interaction.editReply(data.success ? `⏸️ Clé suspendue pour ${suspendDuration}h : ${suspendId}` : `❌ Erreur : ${data.error}`);
          break;
        case "reactivatekey":
          const reactivateId = interaction.options.getString("id");
          data = await callApi("POST", `/keys/reactivate/${reactivateId}`, { by });
          await interaction.editReply(data.success ? `▶️ Clé réactivée : ${reactivateId}` : `❌ Erreur : ${data.error}`);
          break;
        case "transferkey":
          const fromId = interaction.options.getString("from_id");
          const toId = interaction.options.getString("to_id");
          data = await callApi("POST", `/keys/transfer/${fromId}/${toId}`, { by });
          await interaction.editReply(data.success ? `🔄 Clé transférée de ${fromId} vers ${toId}` : `❌ Erreur : ${data.error}`);
          break;
        case "duplicatekey":
          const sourceId = interaction.options.getString("source_id");
          const targetId = interaction.options.getString("target_id");
          data = await callApi("POST", `/keys/duplicate/${sourceId}/${targetId}`, { by });
          await interaction.editReply(data.success ? `📋 Clé dupliquée de ${sourceId} vers ${targetId}` : `❌ Erreur : ${data.error}`);
          break;
      }
    }

    // Commandes de statut et informations
    else if (["userstatus", "keyinfo", "banstatus", "ratelimitstatus", "activestatus", "subscriptionstatus", "usagestats", "keyhistory", "loginhistory", "paymentstatus"].includes(commandName)) {
      const statusId = interaction.options.getString("id");
      switch (commandName) {
        case "userstatus":
          data = await callApi("GET", `/user/${statusId}/status`);
          await interaction.editReply(data.success ? `👤 Statut utilisateur ${statusId}: ${JSON.stringify(data.status, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "keyinfo":
          data = await callApi("GET", `/keys/info/${statusId}`);
          await interaction.editReply(data.success ? `🔑 Infos clé ${statusId}: ${JSON.stringify(data.info, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "banstatus":
          data = await callApi("GET", `/ban/status/${statusId}`);
          await interaction.editReply(data.success ? `🚫 Statut bannissement ${statusId}: ${data.banned ? 'Banni' : 'Non banni'}` : `❌ Erreur : ${data.error}`);
          break;
        case "ratelimitstatus":
          data = await callApi("GET", `/ratelimit/status/${statusId}`);
          await interaction.editReply(data.success ? `⏱️ Statut rate limit ${statusId}: ${data.ratelimited ? 'Limité' : 'Non limité'}` : `❌ Erreur : ${data.error}`);
          break;
        case "activestatus":
          data = await callApi("GET", `/user/${statusId}/activity`);
          await interaction.editReply(data.success ? `📊 Activité ${statusId}: ${JSON.stringify(data.activity, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "subscriptionstatus":
          data = await callApi("GET", `/user/${statusId}/subscription`);
          await interaction.editReply(data.success ? `💳 Abonnement ${statusId}: ${JSON.stringify(data.subscription, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "usagestats":
          data = await callApi("GET", `/user/${statusId}/usage`);
          await interaction.editReply(data.success ? `📈 Stats utilisation ${statusId}: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "keyhistory":
          data = await callApi("GET", `/user/${statusId}/keyhistory`);
          await interaction.editReply(data.success ? `📜 Historique clés ${statusId}: ${JSON.stringify(data.history, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "loginhistory":
          data = await callApi("GET", `/user/${statusId}/loginhistory`);
          await interaction.editReply(data.success ? `🔐 Historique connexions ${statusId}: ${JSON.stringify(data.history, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "paymentstatus":
          data = await callApi("GET", `/user/${statusId}/payments`);
          await interaction.editReply(data.success ? `💰 Paiements ${statusId}: ${JSON.stringify(data.payments, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
      }
    }

    // Commandes d'administration avancées
    else if (["massban", "massunban", "masskeyreset", "clearexpiredkeys", "clearsuspendedkeys", "backupkeys", "restorekeys", "exportkeys", "importkeys"].includes(commandName)) {
      switch (commandName) {
        case "massban":
          const ids = interaction.options.getString("ids").split(",").map(id => id.trim());
          data = await callApi("POST", "/mass/ban", { ids, by });
          await interaction.editReply(data.success ? `✅ Bannissement en masse: ${data.count} utilisateurs bannis` : `❌ Erreur : ${data.error}`);
          break;
        case "massunban":
          const unbanIds = interaction.options.getString("ids").split(",").map(id => id.trim());
          data = await callApi("POST", "/mass/unban", { ids: unbanIds, by });
          await interaction.editReply(data.success ? `✅ Débannissement en masse: ${data.count} utilisateurs débannis` : `❌ Erreur : ${data.error}`);
          break;
        case "masskeyreset":
          const resetIds = interaction.options.getString("ids").split(",").map(id => id.trim());
          data = await callApi("POST", "/mass/keyreset", { ids: resetIds, by });
          await interaction.editReply(data.success ? `✅ Reset clés en masse: ${data.count} clés reset` : `❌ Erreur : ${data.error}`);
          break;
        case "clearexpiredkeys":
          data = await callApi("DELETE", "/keys/expired", { by });
          await interaction.editReply(data.success ? `🧹 ${data.count} clés expirées nettoyées` : `❌ Erreur : ${data.error}`);
          break;
        case "clearsuspendedkeys":
          data = await callApi("DELETE", "/keys/suspended", { by });
          await interaction.editReply(data.success ? `🧹 ${data.count} clés suspendues nettoyées` : `❌ Erreur : ${data.error}`);
          break;
        case "backupkeys":
          data = await callApi("POST", "/keys/backup", { by });
          await interaction.editReply(data.success ? `💾 Sauvegarde créée: ID ${data.backup_id}` : `❌ Erreur : ${data.error}`);
          break;
        case "restorekeys":
          const backupId = interaction.options.getString("backup_id");
          data = await callApi("POST", "/keys/restore", { backup_id: backupId, by });
          await interaction.editReply(data.success ? `🔄 Restauration terminée: ${data.count} clés restaurées` : `❌ Erreur : ${data.error}`);
          break;
        case "exportkeys":
          data = await callApi("GET", "/keys/export");
          await interaction.editReply(data.success ? `📤 Export disponible: ${data.download_url}` : `❌ Erreur : ${data.error}`);
          break;
        case "importkeys":
          const attachment = interaction.options.getAttachment("file");
          data = await callApi("POST", "/keys/import", { file_url: attachment.url, by });
          await interaction.editReply(data.success ? `📥 Import terminé: ${data.count} clés importées` : `❌ Erreur : ${data.error}`);
          break;
      }
    }

    // Commandes de monitoring et rapports
    else if (["serverstats", "keystats", "banstats", "activestats", "dailystats", "weeklystats", "monthlystats", "topusers", "newusers", "expiringkeys"].includes(commandName)) {
      switch (commandName) {
        case "serverstats":
          data = await callApi("GET", "/stats/server");
          await interaction.editReply(data.success ? `📊 Stats serveur: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "keystats":
          data = await callApi("GET", "/stats/keys");
          await interaction.editReply(data.success ? `🔑 Stats clés: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "banstats":
          data = await callApi("GET", "/stats/bans");
          await interaction.editReply(data.success ? `🚫 Stats bannissements: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "activestats":
          data = await callApi("GET", "/stats/activity");
          await interaction.editReply(data.success ? `📈 Stats activité: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "dailystats":
          data = await callApi("GET", "/stats/daily");
          await interaction.editReply(data.success ? `📅 Stats quotidiennes: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "weeklystats":
          data = await callApi("GET", "/stats/weekly");
          await interaction.editReply(data.success ? `📆 Stats hebdomadaires: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "monthlystats":
          data = await callApi("GET", "/stats/monthly");
          await interaction.editReply(data.success ? `🗓️ Stats mensuelles: ${JSON.stringify(data.stats, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "topusers":
          const limit = interaction.options.getInteger("limit") || 10;
          data = await callApi("GET", `/stats/topusers?limit=${limit}`);
          await interaction.editReply(data.success ? `🏆 Top ${limit} utilisateurs: ${JSON.stringify(data.users, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "newusers":
          const days = interaction.options.getInteger("days") || 7;
          data = await callApi("GET", `/stats/newusers?days=${days}`);
          await interaction.editReply(data.success ? `🆕 Nouveaux utilisateurs (${days}j): ${JSON.stringify(data.users, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "expiringkeys":
          const expDays = interaction.options.getInteger("days") || 7;
          data = await callApi("GET", `/stats/expiringkeys?days=${expDays}`);
          await interaction.editReply(data.success ? `⏰ Clés expirant dans ${expDays}j: ${JSON.stringify(data.keys, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
      }
    }

    // Commandes de gestion des permissions
    else if (["giveadmin", "removeadmin", "givemod", "removemod", "givevip", "removevip"].includes(commandName)) {
      const permId = interaction.options.getString("id");
      switch (commandName) {
        case "giveadmin":
          data = await callApi("POST", `/permissions/admin/${permId}`, { action: "give", by });
          await interaction.editReply(data.success ? `👑 Admin donné à ${permId}` : `❌ Erreur : ${data.error}`);
          break;
        case "removeadmin":
          data = await callApi("POST", `/permissions/admin/${permId}`, { action: "remove", by });
          await interaction.editReply(data.success ? `👑 Admin retiré à ${permId}` : `❌ Erreur : ${data.error}`);
          break;
        case "givemod":
          data = await callApi("POST", `/permissions/mod/${permId}`, { action: "give", by });
          await interaction.editReply(data.success ? `🛡️ Modérateur donné à ${permId}` : `❌ Erreur : ${data.error}`);
          break;
        case "removemod":
          data = await callApi("POST", `/permissions/mod/${permId}`, { action: "remove", by });
          await interaction.editReply(data.success ? `🛡️ Modérateur retiré à ${permId}` : `❌ Erreur : ${data.error}`);
          break;
        case "givevip":
          const vipDuration = interaction.options.getInteger("duration") || 30;
          data = await callApi("POST", `/permissions/vip/${permId}`, { action: "give", duration: vipDuration, by });
          await interaction.editReply(data.success ? `⭐ VIP donné à ${permId} pour ${vipDuration} jours` : `❌ Erreur : ${data.error}`);
          break;
        case "removevip":
          data = await callApi("POST", `/permissions/vip/${permId}`, { action: "remove", by });
          await interaction.editReply(data.success ? `⭐ VIP retiré à ${permId}` : `❌ Erreur : ${data.error}`);
          break;
      }
    }

    // Commandes utilitaires
    else if (["searchuser", "findbykey", "validatekey", "systemhealth", "apistatus", "botinfo", "help"].includes(commandName)) {
      switch (commandName) {
        case "searchuser":
          const query = interaction.options.getString("query");
          data = await callApi("GET", `/search/user?q=${encodeURIComponent(query)}`);
          await interaction.editReply(data.success ? `🔍 Résultats pour "${query}": ${JSON.stringify(data.results, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "findbykey":
          const key = interaction.options.getString("key");
          data = await callApi("GET", `/search/bykey?key=${encodeURIComponent(key)}`);
          await interaction.editReply(data.success ? `🔑 Utilisateur trouvé: ${JSON.stringify(data.user, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "validatekey":
          const validateKey = interaction.options.getString("key");
          const isValid = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(validateKey);
          await interaction.editReply(isValid ? `✅ Format de clé valide` : `❌ Format de clé invalide`);
          break;
        case "systemhealth":
          data = await callApi("GET", "/health");
          await interaction.editReply(data.success ? `💚 Santé système: ${JSON.stringify(data.health, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "apistatus":
          data = await callApi("GET", "/status");
          await interaction.editReply(data.success ? `🟢 API Status: ${JSON.stringify(data.status, null, 2)}` : `❌ Erreur : ${data.error}`);
          break;
        case "botinfo":
          await interaction.editReply(`🤖 Bot Info:\n- Nom: ${client.user.tag}\n- ID: ${client.user.id}\n- Serveurs: ${client.guilds.cache.size}\n- Uptime: ${Math.floor(client.uptime / 1000)}s\n- Commandes: ${commands.length}`);
          break;
        case "help":
          const specificCommand = interaction.options.getString("command");
          if (specificCommand) {
            const cmd = commands.find(c => c.name === specificCommand);
            await interaction.editReply(cmd ? `❓ **/${cmd.name}**: ${cmd.description}` : `❌ Commande "${specificCommand}" non trouvée`);
          } else {
            await interaction.editReply(`📚 **Aide des commandes**\n\n**Gestion des clés:**\n/generatekey, /revokekey, /extendkey, /upgradekey, /getkey, /checkkey, /listkeys, /expirekey, /suspendkey, /reactivatekey, /transferkey, /duplicatekey\n\n**Statut & Infos:**\n/userstatus, /keyinfo, /banstatus, /ratelimitstatus, /activestatus, /subscriptionstatus, /usagestats, /keyhistory, /loginhistory, /paymentstatus\n\n**Administration:**\n/massban, /massunban, /masskeyreset, /clearexpiredkeys, /clearsuspendedkeys, /backupkeys, /restorekeys, /exportkeys, /importkeys\n\n**Monitoring:**\n/serverstats, /keystats, /banstats, /activestats, /dailystats, /weeklystats, /monthlystats, /topusers, /newusers, /expiringkeys\n\n**Permissions:**\n/giveadmin, /removeadmin, /givemod, /removemod, /givevip, /removevip\n\n**Utilitaires:**\n/searchuser, /findbykey, /validatekey, /systemhealth, /apistatus, /botinfo\n\nUtilise /help <commande> pour plus d'infos sur une commande spécifique.`);
          }
          break;
      }
    }

    else {
      await interaction.editReply("❌ Commande non reconnue");
    }

  } catch (e) {
    console.error("Erreur commande:", e);
    const errorMsg = e.message.includes("ECONNREFUSED") ? 
      "❌ API inaccessible - vérifiez que le serveur API est démarré" :
      e.message.includes("Parse error") ? 
      "❌ Erreur de réponse de l'API" :
      "❌ Erreur interne du bot";
    await interaction.editReply(errorMsg);
  }
});

client.login(process.env.DISCORD_TOKEN);
