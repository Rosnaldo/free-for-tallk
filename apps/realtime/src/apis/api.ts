import properties from '../properties';
import { buildLogger } from '#logger';
import axios from 'axios';


// Every call through this client forwards the connecting user's own token
// (see auth/verify_token.ts and services/users.ts) -- realtime has no
// service-account identity of its own to fall back to.
export function createApiClient(traceId = 'system') {
    const log = buildLogger(traceId);
    const client = axios.create({ baseURL: properties.apiUri });

    client.interceptors.request.use(async (config) => {
        config.headers['x-trace-id'] = traceId;
        return config;
    });

    client.interceptors.response.use(undefined, (error) => {
        if (axios.isAxiosError(error)) {
            log.error({ status: error.response?.status, message: error.response?.data, url: error.config?.url }, 'apiApi error');
        } else {
            log.error(error, 'apiApi error');
        }
        return Promise.reject(error);
    });

    return client;
}
