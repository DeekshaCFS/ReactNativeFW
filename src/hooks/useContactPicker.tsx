import {useCallback, useState} from 'react';
import SearchPickerModal from '../components/SearchPickerModal';
import {loadDeviceContacts, type DeviceContact} from '../utils/contactPicker';
import {tr} from '../i18n/tr';

export const useContactPicker = (onPick: (contact: DeviceContact) => void) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<DeviceContact[]>([]);

  const openContacts = useCallback(async () => {
    setVisible(true);
    setLoading(true);
    try {
      const list = await loadDeviceContacts();
      if (list === null) {
        setVisible(false);
      } else {
        setContacts(list);
      }
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Render this inside the same <Modal> as the field it fills.
  const contactPickerModal = (
    <SearchPickerModal
      visible={visible}
      title={tr('Select Contact')}
      loading={loading}
      emptyText={tr('No contacts found.')}
      options={contacts.map((contact, index) => ({
        id: index,
        label: contact.phone ? `${contact.name} · ${contact.phone}` : contact.name,
      }))}
      onSelect={option => {
        const picked = contacts[option.id];
        if (picked) {
          onPick(picked);
        }
        setVisible(false);
      }}
      onClose={() => setVisible(false)}
    />
  );

  return {openContacts, contactPickerModal};
};