import { createApiClient } from '#apis/api';

export interface ApiValidateResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export async function verifyToken(traceId: string, token: string): Promise<ApiValidateResponse> {
    const response = await createApiClient(traceId).post<ApiValidateResponse>('/auth/validate-token', {}, {
        headers: { Authorization: token },
    });
    return response.data;
}
