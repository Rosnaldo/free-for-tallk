class Properties {
    private static instance: Properties;

    nodeEnv: string;
    port: string | number;
    apiUri: string;
    corsOrigins: string[];
    dailyApiKey: string;
    dailyApiUrl: string;
    webhookUrl: string;
    ngrokDomain: string;
    redisUri: string;
    internalSecret: string;

    private constructor() {
        this.nodeEnv = process.env.NODE_ENV || '';
        this.port = process.env.PORT || 5003;
        this.apiUri = process.env.API_URI || '';
        this.corsOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
        this.dailyApiKey = process.env.DAILY_API_KEY || '';
        this.dailyApiUrl = process.env.DAILY_API_URL || 'https://api.daily.co/v1';
        this.webhookUrl = process.env.WEBHOOK_URL || '';
        this.ngrokDomain = process.env.NGROK_DOMAIN || '';
        this.redisUri = process.env.REDIS_URI || '';
        this.internalSecret = process.env.INTERNAL_SECRET || 'dev-internal-secret';
    }

    static getInstance(): Properties {
        if (!Properties.instance) {
            Properties.instance = new Properties();
        }
        return Properties.instance;
    }

    static override(overrides: Partial<Properties>): void {
        const instance = Properties.getInstance();
        Object.assign(instance, overrides);
    }

    static reset(): void {
        const fresh = new Properties();
        if (Properties.instance) {
            Object.assign(Properties.instance, fresh);
        } else {
            Properties.instance = fresh;
        }
    }
}

export default Properties.getInstance();
export { Properties };
