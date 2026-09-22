import {mkdir, readFile, writeFile} from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

interface Config {
    apiKey: string;
}

const CONFIG_DIR = path.join(homedir(), "make-transparent");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

async function ask(question: string): Promise<string> {
    const rl = createInterface({
        input: stdin,
        output: stdout,
    });

    try {
        return await rl.question(question);
    } finally {
        rl.close();
    }
}
async function loadConfig(): Promise<Config | null> {
    try {
        const data = await readFile (CONFIG_FILE, "utf8");
        return JSON.parse(data) as Config;
    } catch {
        return null;
    }
}
async function saveConfig(config: Config): Promise<void> {
    await mkdir(CONFIG_DIR, {recursive: true });
    await writeFile(
        CONFIG_FILE,
        JSON.stringify(config, null, 2),
        "utf8",
    );
}

export async function getApiKey(): Promise<string> {
    const existing = await loadConfig();

    if (existing?.apiKey) {
        console.log("API key loaded.\n");
        return existing.apiKey;
    }

    console.log("No API key found");
    console.log("You nly need to enter this once.\n");

    const apiKey = (await ask("Hack Club AI API key:\n> ")).trim();

    if (!apiKey) {
        throw new Error("API key is required.");
    }

    await saveConfig({
        apiKey,
    });
    console.log("API key saved\n");
    return apiKey;
}

export async function getPinterestCookies(): Promise<any[] | undefined> {
    console.log("Cookies are OPTIONAL");
    console.log("These are usefull for private boards");
    console.log("Paste your exported JSON cookies OR enter a path to the cookies JSON file");
    console.log("Press Enter to skip");
    const input = (await ask("Cookies:\n> ")).trim();

    if (!input) {
        console.log("No cookies provided.");
        return undefined;
    }

    let rawCookies: unknown;
    try {
        if (
            input.startsWith("[") || 
            input.startsWith("{")
        ) {
            rawCookies = JSON.parse(input);
        } else {
            const file = await readFile(input, "utf8");
            rawCookies = JSON.parse(file);
        }
    } catch {
        throw new Error("Could not read cookies. Paste valid JSON or provide a valid JSON file path.",);
    }
    if (!Array.isArray(rawCookies)) {
        throw new Error("Cookies must be a JSON array exported from your browser.",

        )
    }
    console.log(`Loaded ${rawCookies.length} for this run`);
    return rawCookies;
}
