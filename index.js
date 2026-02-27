const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

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

client.on('ready', () => console.log(`${client.user.tag} 起動完了`));

client.on('messageCreate', async (message) => {
  // 自分の投稿や指定チャンネル以外は無視（※ニュースボットを監視したい場合は author.bot 条件を外す）
  if (message.channel.id !== MONITOR_CHANNEL_ID) return;
  if (message.author.id === client.user.id) return; // 自分の投稿ループ防止

  // 画像が生成されるまで少し待つ
  await new Promise(res => setTimeout(res, 3000));
  const msg = await message.channel.messages.fetch(message.id);

  let allImages = [];

  // パターン1：URLプレビューなどの「埋め込み画像」を収集
  msg.embeds.forEach(e => {
    if (e.image) allImages.push({ image: { url: e.image.url } });
  });

  // パターン2：スマホ等から直接上げた「添付画像」を収集
  msg.attachments.forEach(a => {
    if (a.contentType && a.contentType.startsWith('image/')) {
      allImages.push({ image: { url: a.url } });
    }
  });

  console.log("GASへ送信。画像検知数:", allImages.length);

  await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      content: msg.content,
      embeds: allImages
    }),
    headers: { 'Content-Type': 'application/json' }
  });
});

client.login(TOKEN);
