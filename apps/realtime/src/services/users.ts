import { IUser } from "@repo/shared-types";
import { createApiClient } from "../apis/api";
import properties from "../properties";

export const userExists = async (traceId: string, email: string, token: string): Promise<IUser> => {
    const { data } = await createApiClient(traceId).get<IUser>('/users/exists', {
        headers: { Authorization: token },
        params: { email },
    });
    return data;
};

export const findUserBySlug = async (slug: string): Promise<IUser | undefined> => {
    const response = await fetch(`${properties.apiUri}/internal/users/find-by-slug?slug=${encodeURIComponent(slug)}`, {
        headers: { 'x-internal-secret': properties.internalSecret },
    });
    if (!response.ok) return undefined;
    return response.json();
};
