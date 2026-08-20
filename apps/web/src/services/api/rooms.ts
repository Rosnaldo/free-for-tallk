import type { IRoom } from '@repo/shared-types';
import { apiBack } from '../../api/backend';

export async function fetchRooms(): Promise<IRoom[]> {
    const res = await apiBack.get('/rooms');
    return res.data.rooms as IRoom[];
}
