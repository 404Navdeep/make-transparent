import Replicate from "replicate";

const MODEL_ID = "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1";

export async function removeBackground(imageUrl: string, apiKey: string): Promise<string> {
    const replicate = new Replicate({
        auth: apiKey,
        baseUrl: "https://ai.hackclub.com/proxy/v1/replicate",
    });

    const output = await replicate.run(MODEL_ID, {
        input: {
            image: imageUrl,
        },
    });

    return getOutputUrl(output);
}

function getOutputUrl(output: unknown): string {
    if (typeof output === "string") {
        return output;
    }

    if (Array.isArray(output)) {
        for (const item of output) {
            try {
                return getOutputUrl(item);
            } catch {
                continue;
            }
        }
    }

    if (output && typeof output === "object") {
        const file = output as { url?: unknown };

        if (typeof file.url === "function") {
            return file.url();
        }

        if (typeof file.url === "string") {
            return file.url;
        }
    }

    throw new Error(`Couldn't find output URL: ${JSON.stringify(output)}`);
}
