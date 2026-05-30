import {APIGatewayProxyEventV2} from 'aws-lambda';
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {randomUUID} from 'crypto';
import jwt from 'jsonwebtoken';
import {
  generateApiGatewayResponse,
  StatusCodes,
  validateEnv,
} from '@fido-foster-twilio/common';

const s3 = new S3Client({region: 'us-east-1'});

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const IMAGE_EXPIRATION = 300; // 5 minutes

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const requiredEnvVars = ['ALLOWED_ORIGIN', 'JWT_SECRET', 'MEDIA_BUCKET_NAME'];

export const handler = async (event: APIGatewayProxyEventV2) => {
  // Validate env
  let env: Record<string, string>;
  try {
    env = validateEnv(requiredEnvVars);
  } catch (e) {
    console.error(e);
    return generateApiGatewayResponse(StatusCodes.InternalError, {
      message: 'Missing env variables, please contact chelsea/jordan',
    });
  }

  // Verify JWT
  const authHeader =
    event.headers?.authorization ?? event.headers?.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return generateApiGatewayResponse(StatusCodes.Unauthorized, {
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, env.JWT_SECRET);
  } catch {
    return generateApiGatewayResponse(StatusCodes.Unauthorized, {
      message: 'Invalid or expired token',
    });
  }

  // Parse request body
  if (!event.body) {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: 'Missing request body',
    });
  }

  let contentType: string;
  try {
    ({contentType} = JSON.parse(event.body));
  } catch {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: 'Invalid JSON',
    });
  }

  // Validate
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: `Unsupported file type. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
    });
  }

  const ext = EXTENSION_MAP[contentType];
  const imageKey = `uploads/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.MEDIA_BUCKET_NAME,
    Key: imageKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: IMAGE_EXPIRATION,
  });
  return generateApiGatewayResponse(StatusCodes.OK, {uploadUrl, imageKey});
};
