// src/utils/teleCmiCall.ts
//
// Java TelCMI(): with the TeleCMI module on, the customer's number is hidden and a call is bridged
// instead -- TeleCMI rings the technician's phone, then connects the customer. POSTs the same
// payload Java builds to rest.telecmi.com/v2/ind_pcmo_make_call.
import { Alert } from 'react-native';
import { getCurrentCountryCode, getCurrentUserProfile } from '../state/session';
import { TELECMI_APP_ID, TELECMI_FROM_NUMBER, TELECMI_SECRET } from '../config/telecmi';

const TELECMI_URL = 'https://rest.telecmi.com/v2/ind_pcmo_make_call';

const digits = (value: string) => value.replace(/\D/g, '');

export async function placeTeleCmiCall(customerNumber: string | null | undefined) {
  const customer = digits(customerNumber ?? '');
  if (!customer) {
    Alert.alert('Unavailable', 'Contact number is not available.');
    return;
  }

  const technician = digits(getCurrentUserProfile().mobileOrEmail);
  const countryCode = digits(getCurrentCountryCode()) || '91';
  if (!TELECMI_APP_ID || !TELECMI_SECRET || !TELECMI_FROM_NUMBER || !technician) {
    Alert.alert('Unable to place call', 'The calling service is not configured.');
    return;
  }

  const from = Number(TELECMI_FROM_NUMBER);
  const body = {
    appid: TELECMI_APP_ID,
    secret: TELECMI_SECRET,
    from,
    to: Number(countryCode + technician), // technician's own number is called first
    pcmo: [
      { action: 'record' },
      {
        action: 'bridge',
        duration: 100,
        timeout: 20,
        from,
        loop: 2,
        connect: [{ type: 'pstn', number: Number(countryCode + customer) }],
      },
    ],
  };

  try {
    const response = await fetch(TELECMI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.status !== 200 && response.status !== 201 && response.status !== 202) {
      throw new Error(String(response.status));
    }
  } catch {
    Alert.alert('Unable to place call', 'Please try again.');
  }
}
