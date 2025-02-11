const express = require("express");
const { scrapeLogic } = require("./scrapeLogic");
const app = express();

const PORT = process.env.PORT || 4000;


app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
    const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');
const dns = require('dns');
require("dotenv").config();

// 🚀 Ubaci svoj Telegram bot token i chat ID
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const bot = new TelegramBot(token, { polling: false });

// 🔍 URL-ovi sa KupujemProdajem
const urls = {
    "Veš mašine": "https://www.kupujemprodajem.com/bela-tehnika-i-kucni-aparati/ves-masine/pretraga?categoryId=15&groupId=188&locationId=1&priceTo=150&currency=eur&order=posted%20desc",
    "Frižideri": "https://www.kupujemprodajem.com/bela-tehnika-i-kucni-aparati/frizideri/pretraga?categoryId=15&groupId=190&locationId=1&priceTo=150&currency=eur&order=posted%20desc"
};

let oldAds = {};

// 🌍 Funkcija za proveru internet konekcije
function checkInternetConnection() {
    return new Promise((resolve) => {
        dns.lookup('google.com', (err) => {
            if (err && err.code === "ENOTFOUND") {
                console.log("❌ Nema internet konekcije.");
                resolve(false);
            } else {
                console.log("✅ Internet je dostupan.");
                resolve(true);
            }
        });
    });
}

// 🔍 Funkcija za pretragu oglasa
async function fetchAds(url) {
    let browser;
    try {
        browser = await puppeteer.launch({ 

            headless: true

            args: [
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--single-process",
                "--no-zygote",
            ],
            executablePath:
                process.env.NODE_ENV === "production"
                    ? process.env.PUPPETEER_EXECUTABLE_PATH
                    : puppeteer.executablePath(),

        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 📌 Menjaj selektor ako sajt promeni dizajn
        await page.waitForSelector('.AdItem_adOuterHolder__lACeh');
        const ads = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.AdItem_adOuterHolder__lACeh'))
                .map(ad => ad.id.match(/\d+/)?.[0])
                .filter(Boolean);
        });

        console.log(`🔍 Pronađeno ${ads.length} oglasa.`);
        return ads;
    } catch (error) {
        console.error("❌ Greška pri učitavanju stranice:", error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

// 📩 Funkcija za slanje poruka na Telegram
async function sendMessage(message) {
    try {
        await bot.sendMessage(chatId, message);
        console.log("✅ Poruka poslata na Telegram.");
    } catch (error) {
        console.error("❌ Greška pri slanju poruke:", error);
    }
}

// 🔄 Funkcija za upoređivanje oglasa
async function compareAds(category, newAds) {
    const oldAdsList = oldAds[category] || [];
    const newPosts = newAds.filter(ad => !oldAdsList.includes(ad));

    if (newPosts.length > 0) {
        console.log(`🔔 Novi oglasi za ${category}: ${newPosts.length}`);
        for (let adId of newPosts) {
            const adUrl = `https://www.kupujemprodajem.com/bela-tehnika-i-kucni-aparati/ves-masine/ves-masina/oglas/${adId}`;
            await sendMessage(`🆕 Novi oglas u kategoriji *${category}*: [Pogledaj ovde](${adUrl})`);
        }
    } else {
        console.log(`ℹ️ Nema novih oglasa za ${category}.`);
    }

    oldAds[category] = newAds;
}

// 🏁 Glavna petlja programa
async function main() {
    const internetAvailable = await checkInternetConnection();
    if (!internetAvailable) return;

    await sendMessage("🚀 Program je pokrenut!");

    while (true) {
        console.log("🔄 Pokrećem proveru oglasa...");
        for (let category in urls) {
            const ads = await fetchAds(urls[category]);
            if (ads.length > 0) {
                await compareAds(category, ads);
            }
        }

        console.log("⏳ Sledeća provera za 10 minuta...");
        await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000)); // 10 minuta
    }
}

main();

});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
