// src/styles/globalStyles.ts
//
// Auth screens (Login / Signup / OTP / Company Details) -- sizes, colours and
// spacing follow the Java layouts (activity_login_touchless.xml,
// touchless_signup_activity.xml, activity_mobile_no_verification_touchless.xml,
// welcome_activity.xml); dp values go through dp(), sp values through sp().
import { StyleSheet } from 'react-native';
import { COLORS } from '../theme/theme';
import { ms, dp, sp } from '../utils/responsive';

export const GlobalStyles = StyleSheet.create({
  /* ===== Layout ===== */
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: dp(20),
  },

  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ===== Header / logo (70dp tall, 50dp top, 30dp bottom) ===== */
  header: {
    alignItems: 'center',
    marginTop: dp(39), // Java 50dp minus the logo PNG's 11dp top padding
    marginBottom: dp(20), // Java 30dp minus the PNG's 10dp bottom padding
  },

  logo: {
    width: dp(275), // logo.png art is 77% of its height; 91dp box = 70dp art like Java
    height: dp(91),
  },

  /* ===== Text ===== */
  title: {
    fontSize: sp(24),
    color: COLORS.textBlack,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: sp(16),
    color: COLORS.lightGray,
    textAlign: 'center',
    marginTop: dp(14),
  },

  label: {
    fontSize: sp(13),
    marginBottom: dp(6),
    color: COLORS.lightGray,
  },

  errorText: {
    color: COLORS.primary,
    fontSize: sp(12),
    marginHorizontal: dp(14),
    marginBottom: dp(4),
  },

  /* ===== Form column (30dp side padding, children carry a 10dp margin) ===== */
  form: {
    marginTop: dp(20),
    paddingHorizontal: dp(30),
  },

  /* rounded_border.xml: 1dp light_gray stroke, 20dp corners; 10dp padding */
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: dp(20),
    padding: dp(10),
    margin: dp(10),
    fontSize: sp(16),
    includeFontPadding: false,
    color: COLORS.ink,
  },

  inputError: {
    borderColor: COLORS.primary,
  },

  /* bg_spinner.xml: white, 1dp light_gray stroke, 34dp corners, 40dp tall */
  dropdownWrapper: {
    height: dp(40),
    margin: dp(10),
    paddingHorizontal: dp(12),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: dp(34),
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dropdownText: {
    fontSize: sp(16),
    color: COLORS.textBlack,
  },

  /* ===== Bottom links ===== */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: dp(20),
  },

  footerText: {
    padding: dp(5),
    fontSize: sp(16),
    color: COLORS.lightGray,
  },

  link: {
    marginLeft: dp(10),
    padding: dp(5),
    fontSize: sp(16),
    color: COLORS.primary,
  },

  /* ===== Help ("trouble logging in") ===== */
  helpText: {
    textAlign: 'center',
    fontSize: sp(16),
    color: COLORS.darkGray,
    marginBottom: dp(10),
  },

  helpButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: dp(12),
    marginBottom: dp(10),
  },

  // WhatsApp / Video pills (the original RN design, kept instead of Java's 100dp images).
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dp(10),
    paddingHorizontal: dp(18),
    borderRadius: dp(24),
    minHeight: dp(44),
  },

  whatsappButton: { backgroundColor: '#25D366' },
  videoButton:    { backgroundColor: '#111111' },

  helpButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '600',
    marginLeft: dp(6),
  },

  /* ===== Language row (24dp icon, 15dp gap, bold black 14sp) ===== */
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: dp(20),
  },

  languageText: {
    marginLeft: dp(15),
    fontSize: sp(14),
    fontWeight: 'bold',
    color: COLORS.textBlack,
  },

  /* ===== Country modal (country_dialog.xml: 30dp card, 20dp margin) ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: dp(20),
  },

  modalContent: {
    backgroundColor: COLORS.white,
    maxHeight: '70%',
    borderRadius: dp(30),
    padding: dp(10),
    overflow: 'hidden',
  },

  modalItem: {
    margin: 1,
  },

  modalItemText: {
    margin: dp(8),
    fontSize: sp(14),
    fontWeight: 'bold',
    color: COLORS.textBlack,
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