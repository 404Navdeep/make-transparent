const API_BASE = ""
const MODEL_VERSION = ""
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

export async function removeBackground(imageUrl:string, apiKey: string,): Promise<string> {
    const response = await fetch(
        `${API_BASE}/predictions`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                version: MODEL_VERSION,
                input: {
                    image: imageUrl,
                },
            }),
        },
    );

    if (!response.ok){
        const text = await response.text();
        throw new Error(`Background removal failed(${response.status}): ${text}`);
    }

    const prediction = await response.json();

    if (prediction.status === "succeeded") {
        return getOutputUrl(prediction.output);
    }
    if (prediction.status === "failed") {
        throw new Error(
            prediction.error || "failed :("
        );
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
