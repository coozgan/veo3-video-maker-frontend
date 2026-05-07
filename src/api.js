const API_URL = import.meta.env.VITE_API_URL ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";
function headers() {
    return { "Content-Type": "application/json", "X-API-Key": API_KEY };
}
async function checked(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
    }
    return res.json();
}
export async function generate(params) {
    return checked(await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(params),
    }));
}
export async function pollStatus(op, signal) {
    return checked(await fetch(`${API_URL}/api/status?op=${encodeURIComponent(op)}`, {
        headers: headers(),
        signal,
    }));
}
export async function listHistory(limit = 10, offset = 0) {
    return checked(await fetch(`${API_URL}/api/history?limit=${limit}&offset=${offset}`, { headers: headers() }));
}
/** Read a File as a base64 string (without the data: prefix). */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
