const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

// 秘密の情報は後でRender側で設定します
const TOKEN = process.env.DISCORD_TOKEN;
const GAS_URL = process.env.GAS_DEPLOY_URL;
const MONITOR_CHANNEL_ID = process.env.MONITOR_CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, 
  ]
});

client.on('ready', () => {
  console.log(`${client.user.tag} が起動しました！`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== MONITOR_CHANNEL_ID) return;

  // 全ての画像を配列として取得
  const allEmbeds = message.embeds.map(e => e.toJSON());

  const payload = {
    content: message.content,
    embeds: allEmbeds // 全ての画像を配列で送る
  };

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log("GASへデータを送りました。画像数:", allEmbeds.length);
  } catch (err) {
    console.error("エラー:", err);
  }
});

client.login(TOKEN);
