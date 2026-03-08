const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
const http = require('http');

// Renderのタイムアウト対策（偽の窓口）
http.createServer((req, res) => { res.write("OK"); res.end(); }).listen(process.env.PORT || 8080);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('messageCreate', async (message) => {
  if (message.channel.id !== process.env.MONITOR_CHANNEL_ID) return;
  if (message.author.id === client.user.id) return;

  // 画像が生成されるまでしっかり待つ（3秒）
  await new Promise(res => setTimeout(res, 3000));
  const msg = await message.channel.messages.fetch(message.id);

  let imageList = [];

  // 方法1: 直接アップロードされた画像を拾う
  msg.attachments.forEach(a => {
    if (a.contentType?.startsWith('image/')) imageList.push({ image: { url: a.url } });
  });

  // 方法2: ニュースボットなどの「埋め込み」から画像を拾う
  msg.embeds.forEach(e => {
    if (e.image) imageList.push({ image: { url: e.image.url } });
    else if (e.thumbnail) imageList.push({ image: { url: e.thumbnail.url } });
  });

  console.log(`送信開始: 画像${imageList.length}枚`);

  await fetch(process.env.GAS_DEPLOY_URL, {
    method: 'POST',
    body: JSON.stringify({ content: msg.content, images: imageList }),
    headers: { 'Content-Type': 'application/json' }
  });
});

client.login(process.env.DISCORD_TOKEN);
