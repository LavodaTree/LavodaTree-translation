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
    GatewayIntentBits.GuildMessageReactions,
  ]
});

client.on('ready', () => {
  console.log(`${client.user.tag} が起動しました！`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== MONITOR_CHANNEL_ID) return;

  // 1秒だけ待つ（画像情報がDiscord側で生成されるのを待つおまじない）
  await new Promise(resolve => setTimeout(resolve, 5000));

  // メッセージを最新の状態に更新して画像を取得
  const refreshedMessage = await message.channel.messages.fetch(message.id);
  const allEmbeds = refreshedMessage.embeds.map(e => e.toJSON());

  console.log("GASへデータを送ります。画像数:", allEmbeds.length);

  const payload = {
    content: refreshedMessage.content,
    embeds: allEmbeds
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
