import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!token) {
  console.error('Задайте TELEGRAM_BOT_TOKEN в .env');
  process.exit(1);
}

let activeGroupId = process.env.TELEGRAM_SUPPORT_GROUP_ID?.trim() || null;

function persistGroupId(id) {
  const line = `TELEGRAM_SUPPORT_GROUP_ID=${id}`;
  for (const file of [envPath, rootEnvPath]) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    if (/TELEGRAM_SUPPORT_GROUP_ID=/.test(content)) {
      content = content.replace(/TELEGRAM_SUPPORT_GROUP_ID=.*/m, line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
    fs.writeFileSync(file, content);
  }
}

function connectGroup(chat) {
  const id = String(chat.id);
  if (activeGroupId === id) return;
  activeGroupId = id;
  persistGroupId(id);
  console.log(`\n✅ Группа поддержки подключена: «${chat.title || 'без названия'}» → ${id}\n`);
}

if (!activeGroupId) {
  console.warn(
    'TELEGRAM_SUPPORT_GROUP_ID не задан — добавьте @in_you_bot в группу и напишите там сообщение, ID подхватится автоматически.'
  );
} else {
  console.log(`Группа поддержки: ${activeGroupId}`);
}

const bot = new Telegraf(token);

const WELCOME = `Здравствуйте! 👋

Вы обратились в службу поддержки Aurent.

Опишите вашу проблему — мы передадим обращение команде и ответим вам в этом чате.`;

const CONFIRM = '✅ Спасибо! Ваше сообщение передано в службу поддержки. Мы ответим вам в ближайшее время.';

function formatUser(from) {
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Пользователь';
  const username = from.username ? `@${from.username}` : 'без username';
  return { name, username, id: from.id };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isGroupChat(chat) {
  return chat?.type === 'group' || chat?.type === 'supergroup';
}

async function forwardToGroup(ctx, content) {
  if (!activeGroupId) {
    console.log('Обращение без группы:', ctx.from?.id, content.slice(0, 120));
    return false;
  }

  const { name, username, id } = formatUser(ctx.from);
  const text = [
    '📩 <b>Новое обращение</b>',
    '',
    `<b>От:</b> ${escapeHtml(name)} (${escapeHtml(username)})`,
    `<b>Telegram ID:</b> <code>${id}</code>`,
    '',
    '<b>Сообщение:</b>',
    escapeHtml(content),
  ].join('\n');

  await ctx.telegram.sendMessage(activeGroupId, text, { parse_mode: 'HTML' });
  return true;
}

bot.on('my_chat_member', async (ctx) => {
  if (!isGroupChat(ctx.chat)) return;
  const status = ctx.myChatMember?.new_chat_member?.status;
  if (status === 'member' || status === 'administrator') {
    connectGroup(ctx.chat);
  }
});

bot.start(async (ctx) => {
  if (ctx.chat?.type !== 'private') return;
  await ctx.reply(WELCOME);
});

bot.on('message', async (ctx) => {
  if (isGroupChat(ctx.chat)) {
    if (!activeGroupId) connectGroup(ctx.chat);
    return;
  }

  if (ctx.chat?.type !== 'private') return;

  const text = ctx.message.text?.trim();
  if (text?.startsWith('/')) return;

  const { name, username, id } = formatUser(ctx.from);
  const captionPrefix = `От ${username} (${name}), ID: ${id}`;

  try {
    let forwarded = false;

    if (ctx.message.text) {
      forwarded = await forwardToGroup(ctx, ctx.message.text);
    } else if (ctx.message.photo?.length) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const caption = ctx.message.caption?.trim() || '[фото без подписи]';
      forwarded = await forwardToGroup(ctx, caption);
      if (activeGroupId) {
        await ctx.telegram.sendPhoto(activeGroupId, photo.file_id, {
          caption: captionPrefix,
        });
      }
    } else if (ctx.message.document) {
      const caption = ctx.message.caption?.trim() || ctx.message.document.file_name || '[документ]';
      forwarded = await forwardToGroup(ctx, caption);
      if (activeGroupId) {
        await ctx.telegram.sendDocument(activeGroupId, ctx.message.document.file_id, {
          caption: captionPrefix,
        });
      }
    } else {
      forwarded = await forwardToGroup(ctx, '[сообщение без текста]');
    }

    await ctx.reply(forwarded ? CONFIRM : '✅ Сообщение получено. Группа поддержки подключается — мы ответим вам здесь в ближайшее время.');
  } catch (err) {
    console.error('Ошибка пересылки в группу:', err);
    await ctx.reply('Не удалось отправить обращение. Попробуйте позже или позвоните в поддержку.');
  }
});

bot.launch().then(() => {
  console.log('Бот поддержки запущен (@in_you_bot)');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
