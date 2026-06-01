import {APIGatewayProxyEventV2} from 'aws-lambda';
import {google} from 'googleapis';
import twilio from 'twilio';
import qs from 'qs';
import {
  generateApiGatewayResponse,
  StatusCodes,
  validateEnv,
} from '@fido-foster-twilio/common';

const requiredEnvVars = [
  'ALLOWED_ORIGIN',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_MESSAGING_SERVICE_SID',
  'NOTIFICATION_PHONE_NUMBER',
  'WEBHOOK_URL',
  'GOOGLE_SHEET_ID',
  'GOOGLE_CREDENTIALS',
];

const SHEET_RANGE = 'Contacts!A:E';
const PHONE_COLUMN = 'phone';
const NAME_COLUMN = 'name';

export const handler = async (event: APIGatewayProxyEventV2) => {
  // Validate env
  let env: Record<string, string>;
  try {
    env = validateEnv(requiredEnvVars);
  } catch (e) {
    console.error(e);
    return generateApiGatewayResponse(StatusCodes.InternalError, {
      message: 'Server misconfiguration',
    });
  }

  if (!event.body) {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: 'Missing request body',
    });
  }

  // Twilio sends form-encoded data, decode it
  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;

  const params = qs.parse(body) as Record<string, string>;

  // Validate Twilio signature
  const twilioSignature =
    event.headers?.['x-twilio-signature'] ??
    event.headers?.['X-Twilio-Signature'];

  if (!twilioSignature) {
    console.warn('Missing Twilio signature');
    return generateApiGatewayResponse(StatusCodes.Unauthorized, {
      message: 'Missing Twilio signature',
    });
  }

  const isValid = twilio.validateRequest(
    env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    env.WEBHOOK_URL,
    params,
  );

  if (!isValid) {
    console.warn('Invalid Twilio signature');
    return generateApiGatewayResponse(StatusCodes.Unauthorized, {
      message: 'Invalid Twilio signature',
    });
  }

  // Extract message details
  const fromNumber = params['From'];
  const messageBody = params['Body'];

  if (!fromNumber || !messageBody) {
    return generateApiGatewayResponse(StatusCodes.BadRequest, {
      message: 'Missing From or Body in webhook payload',
    });
  }

  let displayName = fromNumber;
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

    const nameIndex = headers.findIndex(
      (h: string) => h.toLowerCase() === NAME_COLUMN,
    );
    const phoneIndex = headers.findIndex(
      (h: string) => h.toLowerCase() === PHONE_COLUMN,
    );

    if (nameIndex !== -1 && phoneIndex !== -1) {
      const match = dataRows.find(
        row => row[phoneIndex] === fromNumber.replace('+', ''),
      );
      if (match?.[nameIndex]) {
        displayName = match[nameIndex];
      }
    }
  } catch (e) {
    console.warn('Failed to look up name from sheet, using phone number:', e);
  }

  // Forward to notification number
  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: `Reply from ${displayName}:\n\n${messageBody}`,
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
      to: env.NOTIFICATION_PHONE_NUMBER,
    });
  } catch (e) {
    console.error('Twilio forward error:', e);
    return generateApiGatewayResponse(StatusCodes.InternalError, {
      message: 'Failed to forward message',
    });
  }

  // Twilio expects a TwiML response - empty response tells Twilio not to reply
  return {
    statusCode: 200,
    headers: {'Content-Type': 'text/xml'},
    body: '<Response></Response>',
  };
};
