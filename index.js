const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const http = require('http');
const https = require('https');

// --- Render用サーバー（ここまでは成功しています） ---
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Server is running");
}).listen(process.env.PORT || 8080, () => {
  console.log(`[1/3] Webサーバー起動成功 (Port: ${process.env.PORT || 8080})`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- 起動チェック ---
client.once('ready', () => {
  console.log(`[2/3] Discordログイン成功！: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.channel.id !== process.env.MONITOR_CHANNEL_ID) return;
  if (message.author.id === client.user.id) return;

  console.log(`[3/3] メッセージ検知: 送信を開始します...`);

  // 画像URLを抽出（以前成功していた Embed 形式を意識）
  let images = [];
  message.attachments.forEach(a => { if (a.contentType?.includes('image')) images.push(a.url); });
  message.embeds.forEach(e => { if (e.image) images.push(e.image.url); });

  const payload = JSON.stringify({
    content: message.content,
    images: images
  });

  const url = new URL(process.env.GAS_DEPLOY_URL);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  };

  const req = https.request(options, (res) => {
    console.log(`[完了] GASへの送信ステータス: ${res.statusCode}`);
  });

  req.on('error', (e) => console.error(`[エラー] 送信失敗: ${e.message}`));
  req.write(payload);
  req.end();
});

// ログイン実行とエラー捕捉
console.log("Discordへ接続を試みています...");
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error("[致命的エラー] ログインに失敗しました。トークンが正しいか確認してください:", err.message);
});
