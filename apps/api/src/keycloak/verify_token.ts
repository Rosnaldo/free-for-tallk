import jwt, { JwtHeader, JwtPayload } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

import properties from '../properties';
import { UnauthorizedException } from '../exceptions/unauthorized';

let jwksClient: JwksClient | undefined;

function getJwksClient(): JwksClient {
  if (!jwksClient) {
    jwksClient = new JwksClient({
      jwksUri: properties.keycloakJwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
    });
  }
  return jwksClient;
}

function getSigningKey(header: JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!header.kid) return reject(new Error('No KID found in token header'));
    getJwksClient().getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      const signingKey = key?.getPublicKey();
      if (!signingKey) return reject(new Error('Public key not found for KID'));
      resolve(signingKey);
    });
  });
}

function verifyJwt(token: string, key: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      key,
      { algorithms: ['RS256'], issuer: properties.keycloakIssuer },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as JwtPayload);
      },
    );
  });
}

async function verifyAndDecode(token: string): Promise<JwtPayload> {
  const decodedHeader = jwt.decode(token, { complete: true })?.header as JwtHeader;
  if (!decodedHeader) throw new Error('Invalid token');

  const key = await getSigningKey(decodedHeader);
  return verifyJwt(token, key);
}

export async function verifyToken(token: string): Promise<{ volunteerId: string; email?: string }> {
  try {
    const payload = await verifyAndDecode(token);

    const volunteerId = payload.sub;
    if (!volunteerId) throw new Error('Token missing sub claim');

    return { volunteerId, email: payload.email };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    throw new UnauthorizedException(message);
  }
}

// Accepts any authenticated Keycloak user — customers included — since
// /users/* routes must work for both roles.
export async function verifyUserToken(
  token: string,
): Promise<{ id: string; email?: string; firstName?: string; lastName?: string }> {
  try {
    const payload = await verifyAndDecode(token);

    const id = payload.sub;
    if (!id) throw new Error('Token missing sub claim');

    return {
      id,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    throw new UnauthorizedException(message);
  }
}
