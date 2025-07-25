import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Typography
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  body: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // Form elements
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
  },
  inputFocused: {
    borderColor: COLORS.accent,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: COLORS.text,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  // Status indicators
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  successText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loyalty tiers
  bronzeTier: {
    backgroundColor: '#CD7F32',
    color: COLORS.background,
  },
  silverTier: {
    backgroundColor: '#C0C0C0',
    color: COLORS.text,
  },
  goldTier: {
    backgroundColor: '#FFD700',
    color: COLORS.text,
  },
  tierBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  // Wallet
  walletBalance: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
  },
  // Transaction history
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  transactionPositive: {
    color: COLORS.success,
  },
  transactionNegative: {
    color: COLORS.error,
  },
  // Admin styles
  adminCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  pendingStatus: {
    backgroundColor: COLORS.warning,
    color: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  approvedStatus: {
    backgroundColor: COLORS.success,
    color: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  rejectedStatus: {
    backgroundColor: COLORS.error,
    color: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
});
