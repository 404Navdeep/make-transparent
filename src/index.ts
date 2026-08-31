import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

import { getPinterestImages } from "./pinterest.js";
import { removeBackground } from "./remove-bg.js";

const OG_DIR = path.resolve("output/og");
const TP_DIR = path.resolve("output/tp");

async function download(url: string, destination: string) {
    const response = await fetch(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/151.0.0.0 Safari/537.36",
            "Referer": "https://www.pinterest.com/",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
    });

    if (!response.ok) {
        throw new Error(
            `Download failed: ${response.status} ${response.statusText}`
        );
    }

    const buffer = Buffer.from(
        await response.arrayBuffer()
    );

    await fs.writeFile(destination, buffer);
}

function extensionFromUrl(url: string) {
    const clean = url.split("?")[0].toLowerCase();

    if (clean.endsWith(".png")) return ".png";
    if (clean.endsWith(".webp")) return ".webp";
    if (clean.endsWith(".gif")) return ".gif";

    return ".jpg";
}

async function main() {
    const boardUrl = process.argv[2];
    if (!boardUrl) {
        console.log("Usage: npm start -- <Pintrest board url>");
    
    process.exit(1)}


    if (!process.env.REMOVEBG_KEY) {
        throw new Error("API missing");
    }

    await fs.mkdir(OG_DIR, {
        recursive: true
    });

    await fs.mkdir(TP_DIR, {
        recursive: true
    });

    console.log(`
        Pintrest Background Remover
        Make Transparent!
        ---
        `);
    const images = await getPinterestImages(boardUrl);

    console.log(`
        Found ${images.length} images
        `);
    if (images.length === 0) {
        throw new Error("No images to doewnload")
    }
    for (let i = 0; i < images.length; i++) {
        const url = images[i];

        const number = String(i + 1).padStart(
            3,
            "0"
        );
        const extension = extensionFromUrl(url);
        const originalPath = path.join(
            OG_DIR,
            `${number}${extension}`
        );
        const outputPath = path.join(
            TP_DIR,
            `${number}.png`
        );
        console.log(`[${i + 1}/${images.length}] Downling`);

        try {
            await download(url, originalPath);
            console.log(`[${i + 1}/${images.length}] removing background`);
            const outputUrl = await removeBackground(url);
            await download(
                outputUrl,
                outputPath
            );
            console.log(`[${i + 1}/${images.length}] Donee`);
        } catch (error) {
            console.error(`[${i + 1}/${images.length}] Failed :(`);

            console.error(
            error instanceof Error
            ? error.message
            : error
        );
        }
    }
    console.log(`
        Done now lmme rest
        `)
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
