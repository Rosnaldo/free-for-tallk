import dotenv from 'dotenv';

dotenv.config();

const keycloakBaseUrl = process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080';
const keycloakRealm = process.env.KEYCLOAK_REALM || 'poc';

export const properties = {
  port: Number(process.env.PORT) || 4000,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  internalSecret: process.env.INTERNAL_SECRET || 'secret',
  realtimeInternalUrl: process.env.REALTIME_INTERNAL_URL || 'http://localhost:4200',
  webOrigins: (process.env.WEB_ORIGIN || 'http://localhost:5174').split(',').map((o) => o.trim()).filter(Boolean),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/free-for-talk',
  keycloakBaseUrl,
  keycloakRealm,
  keycloakIssuer: process.env.KEYCLOAK_ISSUER_URL || `${keycloakBaseUrl}/realms/${keycloakRealm}`,
  keycloakJwksUri: `${keycloakBaseUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`,
  keycloakAdminClientId: process.env.KEYCLOAK_CLIENT_ID || 'api',
  keycloakAdminClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  s3Host: process.env.AWS_S3_BUCKET ? `https://${process.env.AWS_S3_BUCKET}.s3.sa-east-1.amazonaws.com` : '',
  cdnHost: process.env.CDN_HOST || '',
};

export default properties;
