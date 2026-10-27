import {Platform} from 'react-native';
import Contacts from 'react-native-contacts';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {showFailureMsg} from './toast';
import {isIndiaCountryDetailsId} from '../state/session';

export type DeviceContact = {name: string; phone: string};

const CONTACTS_PERMISSION =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS;

// Digits only. For India, keep the last 10 digits so "+91 98765 43210" becomes "9876543210".
export const normalizeContactPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  return isIndiaCountryDetailsId() && digits.length > 10 ? digits.slice(-10) : digits;
};

// Returns null when permission is refused, so the caller can close the picker.
export const loadDeviceContacts = async (): Promise<DeviceContact[] | null> => {
  let status = await check(CONTACTS_PERMISSION);
  if (status !== RESULTS.GRANTED) {
    status = await request(CONTACTS_PERMISSION);
  }
  if (status !== RESULTS.GRANTED) {
    showFailureMsg('Allow contacts access to pick a contact.');
    return null;
  }

  const raw = await Contacts.getAll();
  return raw
    .map(contact => ({
      name:
        [contact.givenName, contact.familyName].filter(Boolean).join(' ').trim() ||
        contact.displayName ||
        '',
      phone: normalizeContactPhone(contact.phoneNumbers?.[0]?.number ?? ''),
    }))
    .filter(contact => contact.phone.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
};