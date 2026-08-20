import type { IRoom } from '@repo/shared-types';
import { apiBack } from '../../api/backend';

export async function fetchRooms(): Promise<IRoom[]> {
    const res = await apiBack.get('/rooms');
    return res.data.rooms as IRoom[];
}

export async function addRoom(roomData: {
    title: string;
    subtitle?: string;
    maxSlots: number;
}): Promise<IRoom> {
    const res = await apiBack.post('/rooms', roomData);
    return res.data.room as IRoom;
}

export async function deleteRoom(roomId: string): Promise<void> {
    await apiBack.delete(`/rooms/${roomId}`);
}
