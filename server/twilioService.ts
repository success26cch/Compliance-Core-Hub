// Twilio Integration for DOT Physical Notifications
import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendSMS(toPhoneNumber: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    if (!fromNumber) {
      return { success: false, error: 'Twilio phone number not configured' };
    }

    // Format phone number if needed (ensure it starts with +1 for US)
    let formattedTo = toPhoneNumber.replace(/[^0-9+]/g, '');
    if (!formattedTo.startsWith('+')) {
      if (formattedTo.length === 10) {
        formattedTo = '+1' + formattedTo;
      } else if (formattedTo.length === 11 && formattedTo.startsWith('1')) {
        formattedTo = '+' + formattedTo;
      }
    }

    console.log(`Twilio SMS: Sending from ${fromNumber} to ${formattedTo}`);
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo
    });

    console.log(`Twilio SMS: Message SID ${result.sid}, Status: ${result.status}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('Twilio SMS error:', error.message);
    let userMessage = error.message;
    if (error.message?.includes('unverified') || error.code === 21608) {
      userMessage = 'Twilio trial account: recipient number must be verified at twilio.com first. Upgrade your Twilio account to send to any number.';
    }
    return { success: false, error: userMessage };
  }
}

export async function isTwilioConfigured(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}
