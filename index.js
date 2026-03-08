const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const https = require('https');

// --- Renderの「ポートエラー」を防ぐダミーサーバー ---
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is alive!");
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`[System] Web server listening on port ${PORT}`));

// --- ボット本体の設定 ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 起動確認用
client.once('ready', () => {
  console.log(`[Success] ${client.user.tag} としてログインしました！`);
});

client.on('messageCreate', async (message) => {
  // 監視チャンネル以外、または自分自身の投稿は無視
  if (message.channel.id !== process.env.MONITOR_CHANNEL_ID) return;
  if (message.author.id === client.user.id) return;

  console.log(`[Debug] メッセージを検知: "${message.content.substring(0, 10)}..."`);

  // 画像URLを収集（EmbedsとAttachments両方）
  let imageUrls = [];
  message.attachments.forEach(a => { if (a.contentType?.startsWith('image/')) imageUrls.push(a.url); });
  message.embeds.forEach(e => { if (e.image) imageUrls.push(e.image.url); });

  const data = JSON.stringify({
    content: message.content,
    images: imageUrls
  });

  // GASへ送信
  const url = new URL(process.env.GAS_DEPLOY_URL);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
  };

  const req = https.request(options, (res) => {
    console.log(`[GAS] 送信完了。ステータス: ${res.statusCode}`);
  });

  req.on('error', (e) => console.error(`[Error] GAS送信失敗: ${e.message}`));
  req.write(data);
  req.end();
});

// エラー発生時にログへ書き出す
process.on('unhandledRejection', error => console.error('[Fatal] 未処理の例外:', error));

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('[Error] Discordへのログインに失敗しました。トークンを確認してください。');
  console.error(err);
});
