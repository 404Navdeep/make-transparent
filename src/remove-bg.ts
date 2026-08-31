const API_BASE = process.env.API_BASE
const MODEL = process.env.MODEL

function authHeaders() {
    const key = process.env.REMOVEBG_KEY;

    if (!key) {
        throw new Error("No api key");
    }

    return {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
    };
}

export async function removeBackground(imageUrl:string): Promise<string> {
    const response = await fetch(
        `${API_BASE}/predictions`,
        {
            method: "POST",
            headers: {
                ...authHeaders(),
                Prefer: "wait"
            },
            body: JSON.stringify({
                version: "95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
                input: {
                    image: imageUrl
                }
            })
        }
    );
    const text = await response.text();

    if (!response.ok){
        throw new Error(`Background removal failed(${response.status}): ${text}`);
    }

    const prediction = JSON.parse(text);

    if (prediction.status === "succeeded") {
        return getOutputUrl(prediction.output);
    }
    if (prediction.status === "failed") {
        throw new Error(
            prediction.error || "failed :("
        );
    }

    if (!prediction.id) {
        throw new Error(`Unexpected Replicate response: ${text}`);
    }

    return pollPrediction(prediction.id);
}

async function pollPrediction(id: string): Promise<string> {
    for (let i = 0; i <60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = await fetch(
            `${API_BASE}/predictions/${id}`,
            {
                headers: authHeaders()
            }
        );

        const prediction = await response.json()
        if (prediction.status === "succeeded") {
            return getOutputUrl(prediction.output);
        }
        if (
            prediction.status === "failed" || prediction.status === "canceled") {
                throw new Error(prediction.error || `Prediction ${prediction.status}`);
            }
    }

    throw new Error("Background remobval timed out");
}

function getOutputUrl(output: any): string {
    if (typeof output === "string") {
        return output;
    }
    if (output && typeof output.url === "function") {
        return output.url();
    }

    if (output && typeof output.url === "string") {
        return output.url;
    }

    throw new Error(`Couldn't find output URL: ${JSON.stringify(output)}`);
}
