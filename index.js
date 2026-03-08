const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// Renderを安心させるためのダミー窓口（ここは成功済み）
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot Diagnostic Mode");
}).listen(process.env.PORT || 8080, () => {
  console.log("--- 診断開始 ---");
  console.log("1. Webサーバーは正常に起動しました。");
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // ← これが重要！
  ]
});

client.once('ready', () => {
  console.log("2. 【成功】Discordへの接続に成功しました！");
  console.log(`ログイン名: ${client.user.tag}`);
});

console.log("3. Discordへのログインを試みています...");

// ここでエラーを捕まえてログに出す
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.log("--- 【警告】ログインに失敗しました ---");
  console.error("エラーの内容:", err.message);
  
  if (err.message.includes("Privileged intent")) {
    console.log("原因：Discord Developer Portalで『MESSAGE CONTENT INTENT』がOFFになっています。");
  } else if (err.message.includes("An invalid token was provided")) {
    console.log("原因：トークンが間違っています。前後に余計なスペースが入っていないか確認してください。");
  }
});
