import jwt from 'jsonwebtoken';

export function createDoorDashJWT(): string {
  const developerId = process.env.NEXT_PUBLIC_DOORDASH_DEVELOPER_ID;
  const keyId = process.env.DOORDASH_KEY_ID;
  const signingSecret = process.env.DOORDASH_SIGNING_SECRET;

  if (!developerId || !keyId || !signingSecret) {
    throw new Error('DoorDash credentials not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: now + 300,
    iat: now,
  };

  const token = jwt.sign(
    payload,
    Buffer.from(signingSecret, 'base64'),
    {
      algorithm: 'HS256',
      header: {
        'dd-ver': 'DD-JWT-V1',
      } as any,
    }
  );

  return token;
}
