import { connect } from "cloudflare:sockets";

// --- KONFIGURASI ---
const rootDomain = "yamalxdayat.workers.dev"; 
const serviceName = "lamine"; 
const apiKey = ""; 
const apiEmail = "yamalxdayat@gmail.com"; 
const accountID = ""; 
const zoneID = ""; 

// --- CONSTANT ---
const APP_DOMAIN = `${serviceName}.${rootDomain}`;
const KV_PROXY_URL = "https://raw.githubusercontent.com/FoolVPN-ID/Nautica/refs/heads/main/kvProxyList.json";
const PROXY_BANK_URL = "https://raw.githubusercontent.com/FoolVPN-ID/Nautica/refs/heads/main/proxyList.txt";

// --- HELPERS ---
function reverse(str) { return str.split("").reverse().join(""); }

function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode === "Unknown") return "🌐";
    return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

class Document {
    constructor() {
        this.title = "Nautica Dashboard";
        this.proxies = [];
    }
    setTitle(t) { this.title = t; }
    registerProxies(p, list) { this.proxies.push({ detail: p, links: list }); }
    build() {
        return `
        <html>
        <head><title>${this.title}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family:sans-serif; background:#f4f4f4; padding:20px;">
            <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                <h1 style="color:#2563eb;">${this.title}</h1>
                <p>Status: <span style="color:green;">Online</span></p>
                <hr>
                <h3>Salin Config di Bawah:</h3>
                <textarea style="width:100%; height:200px; border:1px solid #ddd; padding:10px; border-radius:5px;">${this.proxies.map(p => p.links.join('\n')).join('\n\n')}</textarea>
            </div>
        </body>
        </html>`;
    }
}

// --- CORE ---
async function getProxyList() {
    try {
        const res = await fetch(PROXY_BANK_URL);
        if (res.status !== 200) return [];
        const text = await res.text();
        return text.split("\n").filter(Boolean).map(entry => {
            const [ip, port, country, org] = entry.split(",");
            return { proxyIP: ip, proxyPort: port, country, org };
        });
    } catch { return []; }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname.startsWith("/sub")) {
            const proxyList = await getProxyList();
            const doc = new Document();
            const uuid = crypto.randomUUID();
            
            proxyList.slice(0, 15).forEach(p => {
                const link = `vless://${uuid}@${url.hostname}:443?encryption=none&security=tls&sni=${url.hostname}&type=ws&host=${url.hostname}&path=%2F${p.proxyIP}-${p.proxyPort}#${getFlagEmoji(p.country)}-${p.org}`;
                doc.registerProxies(p, [link]);
            });

            return new Response(doc.build(), { headers: { "Content-Type": "text/html" } });
        }

        return new Response("Worker Aktif. Silahkan buka: /sub", { status: 200 });
    }
};
