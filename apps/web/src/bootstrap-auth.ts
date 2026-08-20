import type { Stores } from './states/stores.ts';

export async function bootstrapAuth(stores: Stores): Promise<void> {
    await stores.auth.getState().bootstrap();
}
