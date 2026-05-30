import {APIGatewayProxyEventV2} from 'aws-lambda';
import twilio from 'twilio';
import {google} from 'googleapis';
import jwt from 'jsonwebtoken';
import {
  FosterLengths,
  generateApiGatewayResponse,
  StatusCodes,
  validateEnv,
} from '@fido-foster-twilio/common';

const requiredEnvVars = [
  'ALLOWED_ORIGIN',
  'JWT_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_MESSAGING_SERVICE_SID',
  'GOOGLE_SHEET_ID',
  'GOOGLE_CREDENTIALS',
  'SEND_TWILIO',
  'MEDIA_BUCKET_URL',
];

const SHEET_RANGE = 'Contacts!A:E';
const PHONE_COLUMN = 'phone';
const STRING_TRUE = 'TRUE';

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

  let message: string;
  let categories: string[];
  let imageKey: string | undefined;
  try {
    ({message, categories, imageKey} = JSON.parse(event.body));
  } catch {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: 'Invalid JSON',
    });
  }

  if (!message || !categories?.length) {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: 'Message and at least one category are required',
    });
  }

  const validCatergories = Object.values(FosterLengths);
  if (!categories.every(c => validCatergories.includes(c as FosterLengths))) {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: `Invalid category submitted, valid categories are: ${validCatergories.join(', ')}`,
    });
  }

  // Fetch Google Sheet
  let phoneNumbers: string[];
  try {
    const credentials = JSON.parse(env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({version: 'v4', auth});
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values ?? [];
    const [headers, ...dataRows] = rows;

    // Find column indices
    const phoneIndex = headers.findIndex(
      (h: string) => h.toLowerCase() === PHONE_COLUMN,
    );
    const categoryIndices = categories.map(cat =>
      headers.findIndex((h: string) => h.toLowerCase() === cat.toLowerCase()),
    );

    if (phoneIndex === -1) {
      throw new Error('Phone column not found in sheet');
    }
    const selectedCategories = categoryIndices.filter(idx => idx !== -1);
    if (selectedCategories.length === 0) {
      throw new Error('Unable to find any category provided in sheet');
    }

    // Filter rows where any selected category is TRUE
    const filteredNumbers = dataRows
      .filter(row =>
        selectedCategories.some(idx => row[idx]?.toUpperCase() === STRING_TRUE),
      )
      .map(row => row[phoneIndex])
      .filter(Boolean);

    // Deduplicate
    phoneNumbers = [...new Set(filteredNumbers)];
  } catch (e) {
    console.error('Google Sheets error:', e);
    return generateApiGatewayResponse(StatusCodes.InternalError, {
      message: 'Failed to fetch recipients from sheet',
    });
  }

  if (!phoneNumbers.length) {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: 'No recipients found for selected categories',
    });
  }

  if (env.SEND_TWILIO !== 'true') {
    return generateApiGatewayResponse(StatusCodes.OK, {
      message: `Twilio disabled - would have sent to ${phoneNumbers.length} recipient(s)`,
    });
  }

  // Send messages via Twilio
  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    await Promise.all(
      phoneNumbers.map(to =>
        client.messages.create({
          body: message,
          messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
          to,
          ...(imageKey && {
            mediaUrl: [`${env.MEDIA_BUCKET_URL}/${imageKey}`],
          }),
        }),
      ),
    );
  } catch (e) {
    console.error('Twilio error:', e);
    return generateApiGatewayResponse(StatusCodes.InternalError, {
      message: 'Failed to send messages',
    });
  }

  return generateApiGatewayResponse(StatusCodes.OK, {
    message: `Message sent to ${phoneNumbers.length} recipient(s)`,
  });
};
