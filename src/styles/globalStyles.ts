// src/styles/globalStyles.ts
import { StyleSheet } from 'react-native';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';

export const GlobalStyles = StyleSheet.create({
  /* ===== Layout ===== */
  container: {
    flex: 1,
    paddingHorizontal: ms(24),
  },

  // Use this as contentContainerStyle for the ScrollView inside auth screens
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: ms(0),
    paddingTop: ms(30),
    paddingBottom: ms(32),
  },

  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ===== Text ===== */
  title: {
    fontSize: sp(28),
    fontWeight: '400',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: ms(10),
  },

  subtitle: {
    fontSize: sp(17),
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: ms(24),
    lineHeight: sp(24),
  },

  label: {
    fontSize: sp(13),
    marginBottom: ms(6),
    color: COLORS.textTertiary,
  },

  footerText: {
    marginTop: ms(20),
    textAlign: 'center',
    color: COLORS.textTertiary,
    fontSize: sp(16),
  },

  link: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: sp(16),
  },

  errorText: {
    color: COLORS.primary,
    fontSize: sp(12),
    marginTop: -ms(10),
    marginBottom: ms(14),
    paddingHorizontal: ms(4),
  },

  /* ===== Inputs ===== */
  input: {
    borderWidth: 1,
    borderColor: '#505050',
    borderRadius: ms(26),
    paddingHorizontal: ms(16),
    width: '100%',
    height: ms(48),
    marginBottom: ms(14),
    fontSize: sp(16),
    color: COLORS.textPrimary,
  },

  inputError: {
    borderColor: COLORS.primary,
  },

  /* ===== Dropdown / Selector ===== */
  dropdownWrapper: {
    borderWidth: 1,
    borderColor: '#505050',
    borderRadius: ms(26),
    height: ms(48),
    justifyContent: 'center',
    paddingHorizontal: ms(16),
    width: '100%',
    marginBottom: ms(16),
  },

  dropdownText: {
    fontSize: sp(15),
    color: COLORS.textPrimary,
  },

  /* ===== Modal ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(360),
    maxHeight: '60%',
    borderRadius: ms(12),
    paddingVertical: ms(8),
  },

  modalItem: {
    paddingVertical: ms(14),
    paddingHorizontal: ms(16),
  },

  modalItemText: {
    fontSize: sp(15),
    color: COLORS.textPrimary,
  },

  /* ===== Header ===== */
  header: {
    alignItems: 'center',
    marginBottom: ms(16),
  },

  logo: {
    width: ms(220),
    height: ms(160),
  },

  /* ===== Help / Support Buttons ===== */
  helpText: {
    marginTop: ms(14),
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: sp(16),
    paddingVertical: ms(8),
  },

  helpButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ms(12),
    marginTop: ms(16),
  },

  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ms(10),
    paddingHorizontal: ms(18),
    borderRadius: ms(24),
    minHeight: ms(44),
  },

  whatsappButton: { backgroundColor: '#25D366' },
  videoButton:    { backgroundColor: '#111111' },

  helpButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '600',
    marginLeft: ms(6),
  },

  /* ===== Language Row ===== */
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(14),
    paddingVertical: ms(8),
  },

  languageText: {
    marginLeft: ms(6),
    fontSize: sp(16),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },

  /* ===== Home Screen helpers ===== */
  greeting:      { fontSize: sp(13), color: COLORS.textMuted },
  username:      { fontSize: sp(18), fontWeight: '600', color: COLORS.textPrimary },
  primaryCard:   { backgroundColor: COLORS.primary, borderRadius: ms(16), padding: ms(20), marginBottom: ms(24) },
  primaryTitle:  { fontSize: sp(17), fontWeight: '600', color: '#fff' },
  primarySubtitle: { fontSize: sp(13), color: '#fff', marginTop: ms(6), opacity: 0.9 },
  quickActions:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ms(24) },
  actionCard:    { backgroundColor: '#fff', width: '30%', borderRadius: ms(14), paddingVertical: ms(16), alignItems: 'center', elevation: 2 },
  actionText:    { marginTop: ms(8), fontSize: sp(12), color: COLORS.textPrimary },
  section:       { marginTop: ms(8) },
  sectionTitle:  { fontSize: sp(15), fontWeight: '600', marginBottom: ms(12), color: COLORS.textPrimary },
  recentCard:    { backgroundColor: '#fff', borderRadius: ms(14), padding: ms(16), elevation: 1 },
  recentText:    { fontSize: sp(13), color: COLORS.textMuted },
});