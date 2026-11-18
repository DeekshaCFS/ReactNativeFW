// src/screens/technician/main/TaskChecklistScreen.tsx
// Static UI: "Task checklists" screen opened from the box on TaskClosure.
// Shows the task's checklists; tapping one opens its form. All data is hardcoded for now.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform } from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, ms } from '../../../utils/responsive';
import { tr } from '../../../i18n/tr';

// ─── Static data ──────────────────────────────────────────────────────────────

type Answer = 'pass' | 'fail' | 'na';

type Section =
  | { kind: 'fields'; title: string; fields: string[] }
  | { kind: 'checks'; title: string; items: string[] }
  | { kind: 'addRows'; title: string }
  | { kind: 'signature'; title: string; fields: string[] };

interface Checklist {
  id: string;
  name: string;
  sections: Section[];
}

const NETWORKING_SECTIONS: Section[] = [
  {
    kind: 'fields',
    title: '1. Site and Installation Details',
    fields: ['Customer / Site', 'Address', 'Engineer', 'Date', 'Installation type', 'Environment'],
  },
  {
    kind: 'fields',
    title: '2. Network / Wi-Fi Installation Details',
    fields: ['Internet provider', 'Router / firewall', 'Switching', 'Wi-Fi platform', 'Network design', 'Guest network', 'WAN speed'],
  },
  {
    kind: 'fields',
    title: '3. Equipment Summary',
    fields: ['Manufacturer / Brand', 'Model', 'Serial number', 'Equipment location', 'Quantity', 'Notes'],
  },
  {
    kind: 'checks',
    title: '4. Physical Installation and Cabling',
    items: [
      'Cabling and containment are secure, labelled and properly terminated.',
      'Access points are securely mounted in the agreed positions.',
      'PoE / power supply is appropriate for the installed equipment.',
    ],
  },
  { kind: 'addRows', title: '5. Access Point Performance' },
  {
    kind: 'fields',
    title: '6. Network Configuration Record',
    fields: ['Network / SSID', 'VLAN ID', 'Subnet', 'Gateway', 'Security / purpose', 'Notes'],
  },
  {
    kind: 'checks',
    title: '7. System Testing and Commissioning',
    items: [
      'Power supply and backup arrangements have been checked.',
      'System functions have been tested and operate as expected.',
      'Faults, alerts and indicators have been checked.',
      'Customer operation has been demonstrated where applicable.',
    ],
  },
  {
    kind: 'fields',
    title: '8. Variations, Defects and Outstanding Works',
    fields: ['Outstanding work / defect', 'Action by', 'Target date', 'Status'],
  },
  {
    kind: 'signature',
    title: '9. Comments and Sign-off',
    fields: ['Customer name', 'Organisation', 'Engineer name', 'Date / time'],
  },
];

const CHECKLISTS: Checklist[] = [
  { id: 'networking', name: 'Networking & Wi-Fi Access Point', sections: NETWORKING_SECTIONS },
  { id: 'fire', name: 'Fire Alarm Installation & Handover', sections: [] },
  { id: 'intruder', name: 'Intruder Alarm Installation & Handover', sections: [] },
  { id: 'intercom', name: 'Intercom & Door Entry Handover', sections: [] },
  { id: 'cctv', name: 'CCTV Installation / Preventive Maintenance', sections: [] },
  { id: 'video-door', name: 'Video Door Entry Handover', sections: [] },
  { id: 'access-control', name: 'Access Control Handover', sections: [] },
  { id: 'home-cinema', name: 'Home Cinema Handover', sections: [] },
  { id: 'smart-home', name: 'Smart Home Handover', sections: [] },
  { id: 'maintenance', name: 'Maintenance Checklist', sections: [] },
  { id: 'commercial-security', name: 'Commercial Security Handover', sections: [] },
];

const TEAL = '#0B5563';
const TEAL_LIGHT = '#E6F2F4';

// ─── Modal (list <-> form) ────────────────────────────────────────────────────

interface TaskChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  taskId?: number | string;
}

export default function TaskChecklistModal({ visible, onClose, taskId }: TaskChecklistModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CHECKLISTS.find(c => c.id === selectedId) ?? null;

  const goBack = () => {
    if (selected) {
      setSelectedId(null);
    } else {
      onClose();
    }
  };

  const handleModalClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={selected ? goBack : handleModalClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={selected ? goBack : handleModalClose} hitSlop={10}>
            <Ionicons name="arrow-back-outline" size={ms(22)} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selected ? selected.name : tr('Task checklists')}
          </Text>
          {selected ? (
            <Pressable style={styles.saveBtn} onPress={() => {}}>
              <Text style={styles.saveBtnText}>{tr('Save')}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {selected ? (
          <ChecklistForm checklist={selected} />
        ) : (
          <ChecklistList taskId={taskId} onOpen={setSelectedId} />
        )}
      </View>
    </Modal>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

function ChecklistList({ taskId, onOpen }: { taskId?: number | string; onOpen: (id: string) => void }) {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.taskLabel}>{`${tr('Task')} #${taskId ?? ''}`}</Text>
      {CHECKLISTS.map(checklist => (
        <Pressable key={checklist.id} style={styles.listCard} onPress={() => onOpen(checklist.id)}>
          <Text style={styles.listCardTitle}>{checklist.name}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{tr('Not started')}</Text>
          </View>
        </Pressable>
      ))}
      <Text style={styles.listFooter}>{tr('Tap a form to open it. Submitted forms open read-only.')}</Text>
    </ScrollView>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function ChecklistForm({ checklist }: { checklist: Checklist }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const hasSections = checklist.sections.length > 0;

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formTitle}>{checklist.name}</Text>
        <Text style={styles.formMeta}>
          {hasSections ? `${checklist.sections.length} sections · ${tr('Not started')}` : tr('Form not available yet')}
        </Text>
        <View style={styles.formDivider} />

        {checklist.sections.map((section, sIdx) => (
          <View key={`section-${sIdx}`} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.kind === 'fields' &&
              section.fields.map(label => <LabeledInput key={label} label={label} />)}

            {section.kind === 'signature' && (
              <>
                {section.fields.map(label => <LabeledInput key={label} label={label} />)}
                <Text style={styles.fieldLabel}>{tr('Engineer signature')}</Text>
                <View style={styles.signatureBox} />
              </>
            )}

            {section.kind === 'checks' &&
              section.items.map((text, iIdx) => {
                const key = `${sIdx}-${iIdx}`;
                return (
                  <CheckItem
                    key={key}
                    text={text}
                    answer={answers[key]}
                    onAnswer={a => setAnswers(prev => ({ ...prev, [key]: a }))}
                  />
                );
              })}

            {section.kind === 'addRows' && (
              <Pressable style={styles.addRowBtn}>
                <Text style={styles.addRowBtnText}>{`+ ${tr('Add row')}`}</Text>
              </Pressable>
            )}
          </View>
        ))}

        {!hasSections && <Text style={styles.emptyText}>{tr('This checklist has no form yet.')}</Text>}
      </ScrollView>

      {hasSections && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.draftBtn}>
            <Text style={styles.draftBtnText}>{tr('Save draft')}</Text>
          </Pressable>
          <Pressable style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>{tr('Submit form')}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

function LabeledInput({ label }: { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholder={label} placeholderTextColor="#B0B0B0" style={styles.input} />
    </View>
  );
}

function CheckItem({ text, answer, onAnswer }: { text: string; answer?: Answer; onAnswer: (a: Answer) => void }) {
  const options: { key: Answer; label: string }[] = [
    { key: 'pass', label: 'Pass' },
    { key: 'fail', label: 'Fail' },
    { key: 'na', label: 'N/A' },
  ];

  return (
    <View style={styles.checkWrap}>
      <Text style={styles.checkText}>{text}</Text>
      <View style={styles.answerRow}>
        {options.map(option => {
          const active = answer === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.answerBtn, active && styles.answerBtnActive]}
              onPress={() => onAnswer(option.key)}
            >
              <Text style={[styles.answerText, active && styles.answerTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput placeholder={tr('Remarks (optional)')} placeholderTextColor="#B0B0B0" style={styles.input} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(14),
    paddingTop: Platform.OS === 'ios' ? vs(50) : vs(14),
    paddingBottom: vs(12),
  },
  backBtn: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: sp(18),
    fontWeight: '600',
    color: COLORS.white,
    marginHorizontal: scale(10),
  },
  headerSpacer: { width: ms(40) },
  saveBtn: {
    height: ms(36),
    paddingHorizontal: scale(16),
    borderRadius: ms(18),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: COLORS.primary,
    fontSize: sp(14),
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: ms(16),
    paddingBottom: ms(30),
  },
  taskLabel: {
    fontSize: sp(13),
    color: COLORS.midGray,
    marginBottom: vs(10),
  },
  listCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F4F4F4',
    borderRadius: ms(12),
    padding: ms(14),
    marginBottom: vs(12),
  },
  listCardTitle: {
    fontSize: sp(16),
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: vs(10),
  },
  statusPill: {
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: sp(13),
    color: '#6B6B6B',
  },
  listFooter: {
    fontSize: sp(12),
    color: COLORS.midGray,
    marginTop: vs(6),
  },

  // Form
  formContent: {
    padding: ms(16),
    paddingBottom: ms(24),
  },
  formTitle: {
    fontSize: sp(20),
    fontWeight: '700',
    color: COLORS.ink,
  },
  formMeta: {
    fontSize: sp(13),
    color: COLORS.midGray,
    marginTop: vs(4),
  },
  formDivider: {
    height: vs(4),
    backgroundColor: '#EDEDED',
    borderRadius: 2,
    marginVertical: vs(12),
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: ms(12),
    padding: ms(14),
    marginBottom: vs(14),
  },
  sectionTitle: {
    fontSize: sp(16),
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: vs(4),
  },
  fieldWrap: {
    marginTop: vs(8),
  },
  fieldLabel: {
    fontSize: sp(13),
    color: '#555555',
    marginTop: vs(8),
    marginBottom: vs(4),
  },
  input: {
    height: ms(44),
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    fontSize: sp(15),
    color: COLORS.ink,
    backgroundColor: COLORS.white,
    marginTop: vs(4),
  },
  signatureBox: {
    height: ms(120),
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: ms(10),
    backgroundColor: '#FAFAFA',
    marginTop: vs(4),
  },
  checkWrap: {
    marginTop: vs(12),
  },
  checkText: {
    fontSize: sp(14),
    color: COLORS.ink,
    lineHeight: sp(20),
  },
  answerRow: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: vs(8),
  },
  answerBtn: {
    flex: 1,
    height: ms(40),
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  answerBtnActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  answerText: {
    fontSize: sp(14),
    fontWeight: '500',
    color: COLORS.ink,
  },
  answerTextActive: {
    color: COLORS.white,
  },
  addRowBtn: {
    height: ms(40),
    marginTop: vs(8),
    borderWidth: 1,
    borderColor: TEAL,
    borderRadius: ms(10),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowBtnText: {
    fontSize: sp(14),
    fontWeight: '600',
    color: TEAL,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: sp(14),
    color: COLORS.midGray,
    marginTop: vs(30),
  },
  bottomBar: {
    flexDirection: 'row',
    gap: scale(12),
    padding: ms(16),
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
    backgroundColor: COLORS.white,
  },
  draftBtn: {
    flex: 1,
    height: ms(46),
    borderWidth: 1,
    borderColor: TEAL,
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: sp(15),
    fontWeight: '600',
    color: TEAL,
  },
  submitBtn: {
    flex: 1,
    height: ms(46),
    borderRadius: ms(10),
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: sp(15),
    fontWeight: '600',
    color: COLORS.white,
  },
});