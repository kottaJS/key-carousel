import { ProxyAgent } from 'undici';

class LoadBalancer {
    private apiKeys: string[];
    private proxies: string[];
    private keyIndex: number = 0;
    private proxyIndex: number = 0;

    private flaggedKeys: Map<string, number> = new Map();
    private flaggedProxies: Map<string, number> = new Map();
    private readonly FLAG_TIMEOUT = 60 * 60 * 1000; // 1 hour timeout

    constructor() {
        const keysEnv = process.env.API_KEYS || '';
        const proxiesEnv = process.env.PROXIES || '';

        this.apiKeys = keysEnv.split(',').map(k => k.trim()).filter(k => k !== '');
        this.proxies = proxiesEnv.split(',').map(p => p.trim()).filter(p => p !== '');
    }

    public get totalKeys(): number { return this.apiKeys.length; }
    public get totalProxies(): number { return this.proxies.length; }

    public flagKey(apiKey: string) {
        this.flaggedKeys.set(apiKey, Date.now());
    }

    public flagProxy(proxyUrl: string) {
        if (!proxyUrl) return;
        this.flaggedProxies.set(proxyUrl, Date.now());
    }

    public getNextConnection(): { apiKey: string | null, proxyUrl: string | null, dispatcher: ProxyAgent | null } {
        let apiKey = null;
        let proxyUrl = null;
        let dispatcher = null;

        let availableKeys = this.apiKeys.filter(k => {
            if (!this.flaggedKeys.has(k)) return true;
            if (Date.now() - this.flaggedKeys.get(k)! > this.FLAG_TIMEOUT) {
                this.flaggedKeys.delete(k);
                return true;
            }
            return false;
        });

        if (availableKeys.length === 0 && this.apiKeys.length > 0) {
            availableKeys = this.apiKeys;
        }

        if (availableKeys.length > 0) {
            apiKey = availableKeys[this.keyIndex % availableKeys.length];
            this.keyIndex = (this.keyIndex + 1) % availableKeys.length;
        }

        let availableProxies = this.proxies.filter(p => {
            if (!this.flaggedProxies.has(p)) return true;
            if (Date.now() - this.flaggedProxies.get(p)! > this.FLAG_TIMEOUT) {
                this.flaggedProxies.delete(p);
                return true;
            }
            return false;
        });

        if (availableProxies.length > 0) {
            proxyUrl = availableProxies[this.proxyIndex % availableProxies.length];
            this.proxyIndex = (this.proxyIndex + 1) % availableProxies.length;
            dispatcher = new ProxyAgent(proxyUrl);
        }

        return { apiKey, proxyUrl, dispatcher };
    }
}

const loadBalancer = new LoadBalancer();
export default loadBalancer;
