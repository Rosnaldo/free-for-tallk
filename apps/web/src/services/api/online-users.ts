import type { OnlineUser } from '@repo/shared-types';
import { apiBack } from '../../api/backend';

export async function fetchOnlineUsers(): Promise<OnlineUser[]> {
    const res = await apiBack.get('/online-users');
    return res.data.users as OnlineUser[];
}
