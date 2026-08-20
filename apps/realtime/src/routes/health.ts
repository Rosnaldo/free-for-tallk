import { type Application } from 'express';

import { getRedisClient } from '../redis/singleton';

async function isRedisReady(): Promise<boolean> {
    try {
        await getRedisClient().ping();
        return true;
    } catch {
        return false;
    }
}

export default (app: Application) => {
    app.get(
        '/liveness',
        (req, res) => {
            res.status(200).send('ok');
        }
    );

    app.get(
        '/readiness',
        async (req, res) => {
            try {
                const checks = {
                    redis: await isRedisReady(),
                };
                const ready = Object.values(checks).every(Boolean);

                return res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'not ready', checks });
            } catch (err) {
                console.error(err);
                return res.status(500).send('error');
            }
        }
    );
};
