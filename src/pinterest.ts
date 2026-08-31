import fs from "node:fs/promises";
import { chromium, BrowserContext } from "playwright";

const COOKIE_FILE = "pinterest-cookies.json";

function convertCookies(input: any[]) {
    return input
        .filter((c) => {
            const domain = String(c.domain ?? "").toLowerCase();
            return domain.includes("pinterest.com");
        })
        .map((c) => {
            let sameSite: "Strict" | "Lax" | "None" | undefined;

            switch (String(c.sameSite ?? "").toLowerCase()) {
                case "strict":
                    sameSite = "Strict";
                    break;
                case "lax":
                    sameSite = "Lax";
                    break;
                case "none":
                case "no_restriction":
                    sameSite = "None";
                    break;
            }

            const domain = String(c.domain ?? "")
                .replace(/^\[/, "")
                .replace(/["'\],]+$/g, "")
                .replace(/^https?:\/\//, "")
                .replace(/\/.*$/, "");
            
            const cookie: any = {
                name: String(c.name),
                value: String(c.value ?? ""),
                domain: domain.startsWith(".") ? domain : `.${domain}`,
                path: c.path || "/",
                secure: Boolean(c.secure),
                httpOnly: Boolean(c.httpOnly)
            };

            if (sameSite) {
                cookie.sameSite = sameSite;
            }

            if (c.expirationDate && Number(c.expirationDate) > 0 ) {
                cookie.expires = Number(c.expirationDate);
            }

            return cookie;
        });
}

async function loadCookies(context: BrowserContext) {
    try {
        const raw = await fs.readFile(COOKIE_FILE, "utf8");
        const cookies = JSON.parse(raw);

        if (!Array.isArray(cookies)) {
            throw new Error("Cookie file isnt an array");
        }
        const converted = convertCookies(cookies);

        await context.addCookies(converted);
        console.log(`Loaded ${converted.length} Cookies`);
    } catch {console.log("No cookies loaded, use public")
    }
}

export async function getPinterestImages(boardUrl: string): Promise<string[]> {
    const browser = await chromium.launch({
        headless: true
    });
    const context = await browser.newContext({
        userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"+
        "AppleWebKit/537.36 (KHTML, like Gecko)"+
        "Chrome/151.0.0.0 Safari/537.36"
    });
    await loadCookies(context);
    const page = await context.newPage();
    console.log("Opening Pinterest Board");
    await page.goto(boardUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000
    });
    await page.waitForTimeout(3000);
    const imageUrls = new Set<string>();
    const pinUrls =  new Set<string>();

    let unchanged = 0;

    for (let i = 0; i <100 && unchanged < 5; i++) {
        const before = imageUrls.size + pinUrls.size;
        const pins = await page.locator('a[href*="/pin/"]').evaluateAll((elements) => elements.map((el) => (el as HTMLAnchorElement).href));
        
        for (const pin of pins) {
            pinUrls.add(pin.split("?")[0]);
        }

        const images = await page.locator("img").evaluateAll(
    (elements) =>
        elements
            .map((el) => {
                const img = el as HTMLImageElement;
                const srcset = img.getAttribute("srcset");

                if (srcset) {
                    const candidates = srcset
                        .split(",")
                        .map((x) => x.trim())
                        .map((x) => {
                            const [url, width] = x.split(/\s+/);

                            return {
                                url,
                                width: parseInt(
                                    width?.replace("w", "") || "0"
                                ),
                            };
                        })
                        .sort((a, b) => b.width - a.width);

                    return candidates[0]?.url;
                }

                return img.src;
            })
            .filter(Boolean)
        );
        for (const image of images) {
            imageUrls.add(image);
        }

        await page.mouse.wheel(0, 2500);
        await page.waitForTimeout(1500);

        const after = imageUrls.size + pinUrls.size;

        console.log(`Scroll ${i + 1}: ${pinUrls.size}, ${imageUrls.size} images`);

        if (after === before) {
            unchanged++;
        } else {
            unchanged = 0;
        }
    }

    const finalImages = new Set<string>();

    for (const image of imageUrls) {
    if (image.includes("pinimg.com")) {
        finalImages.add(
            getOriginalPinterestUrl(image)
        );
    }
}   

    console.log(`Collected ${finalImages.size} images from board`);
    await browser.close();

    return [...finalImages].filter((url) => {
        return (
            url.includes("pinimg.com") || url.startsWith("https://")
        );
    }
);
function getOriginalPinterestUrl(url: string) {
    return url.replace(
        /\/\d+x\d*\//,
        "/originals/"
    );
}
}