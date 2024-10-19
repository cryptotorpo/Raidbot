import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import { Client } from "twitter-api-sdk";
// import { createUser, getGroupInfo, joinGroup, raidGroup } from "./client.js";

dotenv.config();

const client = new Client(process.env.BEARER_TOKEN);

const app = express();
const port = process.env.PORT || 5000;

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

let post = {},
  status = {},
  likes = {},
  replies = {},
  reposts = {},
  bookmarks = {},
  messageId = {},
  intervalId = {},
  permissions = {},
  startTime = {},
  shield = {};

const getTweetInfo = async (post) => {
  const tmp = post.split("/");
  try {
    const response = await client.tweets.findTweetById(tmp[tmp.length - 1], {
      "tweet.fields": "public_metrics",
    });
    return response.data.public_metrics;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const startRaid = async (chatId, ) => {
  const tmp = await bot.sendVideo(chatId, "./raiding.mp4", {
    caption: `<b>Shield Status: ${
      shield[chatId] ? "🟢\n\n" : "🔴\n\n"
    }</b><b>Raiding chat until the tweet has ${likes[chatId]} likes, ${
      replies[chatId]
    } replies, ${reposts[chatId]} reposts, and ${
      bookmarks[chatId]
    } bookmarks.</b> Check the tweet here: \n\n ${post[chatId]} \n\n`,

    parse_mode: "HTML",
    disable_web_page_preview: "true",
  });
  messageId[chatId] = tmp.message_id;
  bot.pinChatMessage(chatId, tmp.message_id);
  const tmpPermissions = await bot.getChat(chatId);
  permissions[chatId] = tmpPermissions.permissions;
  startTime[chatId] = new Date().getTime();
  if (shield[chatId])
    await bot.setChatPermissions(chatId, {
      can_send_audios: false,
      can_send_documents: false,
      can_send_messages: false,
      can_send_other_messages: false,
      can_send_photos: false,
      can_send_polls: false,
      can_send_video_notes: false,
      can_send_videos: false,
      can_send_voice_notes: false,
    });
  let progress = 1;
  intervalId[chatId] = setInterval(async () => {
    await bot.deleteMessage(chatId, messageId[chatId]);
    const res = await getTweetInfo(post[chatId]);
    let text = "",
      flag = [false, false, false, false];
    if (res.like_count >= likes[chatId])
      (text = `🟢 Current Likes: ${res.like_count} | 🎯 ${likes[chatId]}\n`),
        (flag[0] = true);
    else
      (text = `🔴 Current Likes: ${res.like_count} | 🎯 ${likes[chatId]}\n`),
        (flag[0] = false);
    if (res.reply_count >= replies[chatId])
      (text += `🟢 Current Likes: ${res.reply_count} | 🎯 ${replies[chatId]}\n`),
        (flag[1] = true);
    else
      (text += `🔴 Current Replies: ${res.reply_count} | 🎯 ${replies[chatId]}\n`),
        (flag[1] = false);
    if (res.retweet_count >= reposts[chatId])
      (text += `🟢 Current Likes: ${res.retweet_count} | 🎯 ${reposts[chatId]}\n`),
        (flag[2] = true);
    else
      (text += `🔴 Current Reposts: ${res.retweet_count} | 🎯 ${reposts[chatId]}\n`),
        (flag[2] = false);
    if (res.bookmark_count >= bookmarks[chatId])
      (text += `🟢 Current Likes: ${res.bookmark_count} | 🎯 ${bookmarks[chatId]}\n`),
        (flag[3] = true);
    else
      (text += `🔴 Current Bookmarks: ${res.bookmark_count} | 🎯 ${bookmarks[chatId]}\n`),
        (flag[3] = false);
    if (
      flag[0] === true &&
      flag[1] === true &&
      flag[2] == true &&
      flag[3] == true
    ) {
      await bot.setChatPermissions(chatId, permissions[chatId]);
      clearInterval(intervalId[chatId]);
      let day,
        hours,
        minutes,
        seconds,
        period = (new Date().getTime() - startTime[chatId]) / 1000;

      day = Math.floor(period / 86400);
      period %= 86400;
      hours = Math.floor(period / 3600);
      period %= 3600;
      minutes = Math.floor(period / 60);
      seconds = Math.floor(period % 60);

      let prompt = "";
      if (day > 0) prompt += `${day} ${day > 1 ? "days " : "day "}`;
      if (hours > 0) prompt += `${hours} ${hours > 1 ? "hours " : "hour "}`;
      if (minutes > 0)
        prompt += `${minutes} ${minutes > 1 ? "minutes " : "minute "}`;
      if (seconds > 0)
        prompt += `${seconds} ${seconds > 1 ? "seconds" : "second"}`;
      prompt += "!\n\n";
      bot.sendVideo(chatId, "./basic.mp4", {
        caption: `Tweet has reached at least ${likes[chatId]} likes, ${replies[chatId]} replies, ${reposts[chatId]} reposts, and ${bookmarks[chatId]} bookmarks.\n\nOverall Raid Stats:\n👁Views: ${res.impression_count}\n\n🟢Likes: ${res.like_count}\n🟢Replies: ${res.reply_count}\n🟢Reposts: ${res.retweet_count}\n🟢Bookmarks: ${res.bookmark_count}\n\nThe raid took ${prompt}Unlocking chat.\n\nCheck the tweet here:\n\n${post[chatId]}\n`,

        disable_web_page_preview: "true",
      });
      return;
    }
    text += `\n👁Views: ${res.impression_count}\n\n`;
    if (
      res.like_count * 4 >= progress * likes[chatId] &&
      res.reply_count * 4 >= progress * replies[chatId] &&
      res.retweet_count * 4 >= progress * reposts[chatId] &&
      res.bookmark_count * 4 >= progress * bookmarks[chatId]
    ) {
      const tmp = await bot.sendVideo(chatId, "./raiding.mp4", {
        caption: `<b>Shield Status: ${
          shield[chatId] ? "🟢\n\n" : "🔴\n\n"
        }</b>Current Raid Progress: ${
          progress * 25
        }%</b>\n\n<b>Locking chat until the tweet has ${
          likes[chatId]
        } likes, ${replies[chatId]} replies, ${
          reposts[chatId]
        } reposts, and ${
          bookmarks[chatId]
        } bookmarks.</b> \n\n${text}Check the tweet here:\n\n${
          post[chatId]
        }\n`,

        parse_mode: "HTML",
        disable_web_page_preview: "true",
      });
      await bot.pinChatMessage(chatId, tmp.message_id);
      messageId[chatId] = tmp.message_id;
      progress++;
    }
  }, 1000 * 60);
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id.toString();
  const msgId = msg.message_id;
  try {
    if (msg.pinned_message !== undefined) {
      bot.deleteMessage(chatId, msg.message_id);
    }
  } catch (err) {
    console.log(err);
  }
  if (
    msg.text?.includes("/shield") ||
    msg.text?.includes("/cancel") ||
    msg.text?.includes("/end")
  )
    return;
  try {
    if (status[chatId] === 1) {
      if (
        !(
          msg.text?.startsWith("https://x.com") ||
          msg.text?.startsWith("https://twitter.com")
        )
      ) {
        bot.sendMessage(
          chatId,
          "I'm sorry, I don't recognize that link. To end these prompts, type /end.",
          {
            reply_to_message_id: msgId,
          }
        );
        return;
      }
      const res = getTweetInfo(msg.text);
      if (res === null) {
        bot.sendMessage(
          chatId,
          "It appears the Tweet has either been modified, deleted. Please check the link and try again.",
          { reply_to_message_id: msgId }
        );
        return;
      }
      status[chatId] = 2;
      post[chatId] = msg.text.replace("x.com", "twitter.com");
      const tmp = await bot.sendMessage(
        chatId,
        "Please enter the number of likes required:",
        { reply_to_message_id: msgId }
      );
      messageId[chatId] = tmp.message_id;
      await bot.deleteMessage(chatId, msgId);
      return;
    } else if (status[chatId] === 2) {
      if (isNaN(Number(msg.text))) {
        bot.sendMessage(
          chatId,
          "Invalid input. Please enter a valid number of likes. Type /end to end these promopts.",
          { reply_to_message_id: msgId }
        );
        return;
      }
      likes[chatId] = Number(msg.text);
      status[chatId] = 3;
      await bot.deleteMessage(chatId, messageId[chatId]);
      const tmp = await bot.sendMessage(
        chatId,
        "Please enter the number of replies required:",
        { reply_to_message_id: msgId }
      );
      messageId[chatId] = tmp.message_id;
      await bot.deleteMessage(chatId, msgId);
    } else if (status[chatId] === 3) {
      if (isNaN(Number(msg.text))) {
        bot.sendMessage(
          chatId,
          "Invalid input. Please enter a valid number of replies. Type /end to end these promopts.",
          { reply_to_message_id: msgId }
        );
        return;
      }
      replies[chatId] = Number(msg.text);
      status[chatId] = 4;
      await bot.deleteMessage(chatId, messageId[chatId]);
      const tmp = await bot.sendMessage(
        chatId,
        "Please enter the number of reposts required:",
        { reply_to_message_id: msgId }
      );
      messageId[chatId] = tmp.message_id;
      await bot.deleteMessage(chatId, msgId);
    } else if (status[chatId] === 4) {
      if (isNaN(Number(msg.text))) {
        bot.sendMessage(
          chatId,
          "Invalid input. Please enter a valid number of reposts. Type /end to end these promopts.",
          { reply_to_message_id: msgId }
        );
        return;
      }
      reposts[chatId] = Number(msg.text);
      status[chatId] = 5;
      await bot.deleteMessage(chatId, messageId[chatId]);
      const tmp = await bot.sendMessage(
        chatId,
        "Please enter the number of bookmarks required:",
        { reply_to_message_id: msgId }
      );
      messageId[chatId] = tmp.message_id;
      await bot.deleteMessage(chatId, msgId);
    } else if (status[chatId] === 5) {
      if (isNaN(Number(msg.text))) {
        bot.sendMessage(
          chatId,
          "Invalid input. Please enter a valid number of bookmarks. Type /end to end these promopts.",
          { reply_to_message_id: msgId }
        );
        return;
      }
      bookmarks[chatId] = Number(msg.text);
      status[chatId] = -1;
      await bot.deleteMessage(chatId, messageId[chatId]);
      await bot.deleteMessage(chatId, msgId);

      await startRaid(chatId);
      
    }
  } catch (err) {
    console.log(err);
  }
});

bot.onText(/\/x_shield/, async (msg) => {
  if (msg.chat.type !== "private") {
    const chatId = msg.chat.id;
    let adminList = [];
    await bot.getChatAdministrators(chatId).then((res) => (adminList = res));
    if (adminList.findIndex((admin) => admin.user.id === msg.from.id) === -1) {
      bot.sendMessage(chatId, "Only an administrator can use this command.", {
        reply_to_message_id: msg.message_id,
      });
      return;
    }
    if (adminList.findIndex((admin) => admin.user.id === 7950523260) === -1) {
      bot.sendMessage(chatId, "Promote the bot to admin!");
      return;
    }
    if(msg.text !== '/x_shield') {
    const text = msg.text;
    const words = text.split(' ')
    console.log(words)
    const postUrl = words[1]
    
    if (
      !(
        postUrl.startsWith("https://x.com") ||
        postUrl.startsWith("https://twitter.com")
      )
    ) {
      bot.sendMessage(
        chatId,
        "I'm sorry, I don't recognize that link. To end these prompts, type /end.",
        {
          reply_to_message_id: msg.message_id,
        }
      );
      return;
    }
    const res = getTweetInfo(postUrl);
    if (res === null) {
      bot.sendMessage(
        chatId,
        "It appears the Tweet has either been modified, deleted. Please check the link and try again.",
        { reply_to_message_id: msg.message_id }
      );
      return;
    }
    post[chatId] = postUrl.replace("x.com", "twitter.com");
    status[chatId] = 5
    likes[chatId] = parseInt(words[2]) != NaN ? parseInt(words[2]) : 0
    replies[chatId] = parseInt(words[3]) != NaN ? parseInt(words[3]) : 0
    reposts[chatId] = parseInt(words[4]) != NaN ? parseInt(words[4]) : 0
    bookmarks[chatId] = parseInt(words[5]) != NaN ? parseInt(words[5]) : 0
    if (shield[chatId] === undefined) shield[chatId] = false;
    await startRaid(chatId)
  } else {

    const tmp = await bot.sendMessage(
      chatId,
      `Waiting for Squad Commander's input!\n\n<b>Please enter the X link you'd like to shield!</b>\n\n`,
      { parse_mode: "HTML" }
    );
    status[chatId] = 1;
    likes[chatId] = -1;
    replies[chatId] = -1;
    reposts[chatId] = -1;
    bookmarks[chatId] = -1;
    if (shield[chatId] === undefined) shield[chatId] = false;
    messageId[chatId] = tmp.message_id;
  }
}
});

bot.onText(/\/shield/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== "private") {
    if (shield[chatId] === undefined || shield[chatId] === false) {
      shield[chatId] = true;
      await bot.sendMessage(chatId, "Shield is enabled!");
    } else if (shield[chatId] === true) {
      await bot.sendMessage(chatId, "Shield is already enabled!");
    }
  }
});

bot.onText(/\/attack/, async (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== "private") {
    if (shield[chatId] === undefined || shield[chatId] === true) {
      shield[chatId] = false;
      if (permissions[chatId] !== undefined)
        await bot.setChatPermissions(permissions[chatId]);
      await bot.sendMessage(chatId, "Shield is disabled!");
    } else if (shield[chatId] === false) {
      await bot.sendMessage(chatId, "Shield is already disabled!");
    }
  }
});

bot.onText(/\/end/, async (msg) => {
  if (msg.chat.type !== "private") {
    const chatId = msg.chat.id;
    let adminList = [];
    await bot.getChatAdministrators(chatId).then((res) => (adminList = res));
    if (adminList.findIndex((admin) => admin.user.id === msg.from.id) === -1) {
      bot.sendMessage(chatId, "Only an administrator can use this command.", {
        reply_to_message_id: msg.message_id,
      });
      return;
    }
    if (adminList.findIndex((admin) => admin.user.id === 7950523260) === -1) {
      bot.sendMessage(chatId, "Promote the bot to admin!");
      return;
    }
    status[chatId] = -1;
    bot.sendMessage(chatId, "Shield monitoring has been canceled.", {
      reply_to_message_id: msg.message_id,
    });
  }
});

bot.onText(/\/cancel/, async (msg) => {
  if (msg.chat.type !== "private") {
    const chatId = msg.chat.id;
    let adminList = [];
    await bot.getChatAdministrators(chatId).then((res) => (adminList = res));
    if (adminList.findIndex((admin) => admin.user.id === msg.from.id) === -1) {
      bot.sendMessage(chatId, "Only an administrator can use this command.", {
        reply_to_message_id: msg.message_id,
      });
      return;
    }
    if (adminList.findIndex((admin) => admin.user.id === 7082658254) === -1) {
      bot.sendMessage(chatId, "Promote the bot to admin!");
      return;
    }
    if (status[chatId] === 6) {
      bot.setChatPermissions(chatId, permissions[chatId]);
      clearInterval(intervalId[chatId]);
    }
    status[chatId] = -1;
    if (intervalId[chatId] !== undefined) clearInterval(intervalId[chatId]);
    bot.sendMessage(chatId, "Raid has been cancelled.", {
      reply_to_message_id: msg.message_id,
    });
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `/x_shield - Start a raid on X!\n/telegram_shield - Start a raid to specific telegram group!\n/shield - Turn on the Shield!\n/attack - Turn off the Shield! \n/cancel - Cancel the current raid.\n/end - End the current raid.\n/help - to see available commands.`,
    {
      reply_to_message_id: msg.message_id,
    }
  );
});

const main = async () => {
  app.listen(port, () => console.log(`Server running on port ${port}`));
  // await createUser();
};

main();
