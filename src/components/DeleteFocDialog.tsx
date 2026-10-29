// src/components/DeleteFocDialog.tsx
//
// Java delete_foc_requested_item.xml: "Are you sure?" title, red message,
// "Yes. Delete" (filled) and "Nope. Not Now" (plain).
import React from 'react';
import {useTranslation} from 'react-i18next';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteFocDialog({visible, onConfirm, onCancel}: Props) {
  const {t} = useTranslation();
  return (
    <ConfirmDeleteDialog
      visible={visible}
      title={t('rn_are_you_sure')}
      message={t('delete_foc')}
      messageTone="accent"
      cancelLabel={t('delete_tech_no')}
      cancelTone="neutral"
      confirmLabel={t('delete_tech_yes')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
