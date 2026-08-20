import type KcAdminClient from '@keycloak/keycloak-admin-client' with { 'resolution-mode': 'import' };

import properties from '../properties';

async function fetchServiceAccountAccessToken(): Promise<string> {
  const response = await fetch(`${properties.keycloakBaseUrl}/realms/${properties.keycloakRealm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: properties.keycloakAdminClientId,
      client_secret: properties.keycloakAdminClientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate with keycloak: ${response.status} ${response.statusText}`);
  }

  const { access_token: accessToken } = (await response.json()) as { access_token: string };
  return accessToken;
}

async function getAuthenticatedClient(): Promise<KcAdminClient> {
  // @keycloak/keycloak-admin-client ships ESM-only; the rest of apps/api is
  // CommonJS, so this must be a dynamic import rather than a static one.
  const { default: KcAdminClient } = await import('@keycloak/keycloak-admin-client');

  const client = new KcAdminClient({
    baseUrl: properties.keycloakBaseUrl,
    realmName: properties.keycloakRealm,
  });

  client.setAccessToken(await fetchServiceAccountAccessToken());

  return client;
}

export async function createKeycloakUser(params: { email?: string; firstName: string; lastName: string }): Promise<void> {
  const client = await getAuthenticatedClient();
  await client.users.create({
    ...params,
    username: params.email,
    enabled: true,
  });
}

export async function updateKeycloakUser(email: string, params: { firstName?: string; lastName?: string }): Promise<void> {
  const client = await getAuthenticatedClient();
  const [kcUser] = await client.users.find({ email, exact: true });
  if (!kcUser?.id) throw new Error('User not found on keycloak');

  await client.users.update({ id: kcUser.id }, params);
}

export async function deleteKeycloakUser(email: string): Promise<void> {
  const client = await getAuthenticatedClient();
  const [kcUser] = await client.users.find({ email, exact: true });
  if (!kcUser?.id) throw new Error('User not found on keycloak');

  await client.users.del({ id: kcUser.id });
}
