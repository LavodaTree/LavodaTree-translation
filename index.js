const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
const http = require('http'); // 窓口作成用

const TOKEN = process.env.DISCORD_TOKEN;
const GAS_URL = process.env.GAS_DEPLOY_URL;
const MONITOR_CHANNEL_ID = process.env.MONITOR_CHANNEL_ID;

// --- Renderの「ポートエラー」を防ぐためのダミーサーバー ---
http.createServer((req, res) => {
  res.write("Bot is running!");
  res.end();
}).listen(8080);
// ---------------------------------------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('ready', () => {
  console.log(`${client.user.tag} が正常にログインしました！`);
});

client.on('messageCreate', async (message) => {
  if (message.channel.id !== MONITOR_CHANNEL_ID) return;
  if (message.author.id === client.user.id) return;

  // 画像が生成されるまで少し待つ（3秒）
  await new Promise(res => setTimeout(res, 3000));
  const msg = await message.channel.messages.fetch(message.id);

  let allImages = [];

  // 1. 埋め込み画像（URLプレビュー等）をチェック
  msg.embeds.forEach(e => {
    if (e.image) allImages.push({ image: { url: e.image.url } });
    if (e.thumbnail) allImages.push({ image: { url: e.thumbnail.url } });
  });

  // 2. 添付画像（直接アップロード）をチェック
  msg.attachments.forEach(a => {
    if (a.contentType && a.contentType.startsWith('image/')) {
      allImages.push({ image: { url: a.url } });
    }
  });

  console.log(`GASへデータを送ります。検知した画像数: ${allImages.length}`);

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({
        content: msg.content,
        embeds: allImages
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`GAS送信結果: ${response.status}`);
  } catch (error) {
    console.error("GASへの送信中にエラーが発生しました:", error);
  }
});

// ログインエラーを捕まえてログに出す
client.login(TOKEN).catch(err => {
  console.error("Discordへのログインに失敗しました。トークンが正しいか確認してください。");
  console.error("エラー内容:", err.message);
});
