/**
 * Utility functions for rounding loan installment amounts
 * Uses INVERTED calculation: from desired installment amount back to interest rate
 *
 * Example: $100,000 loan in 5 installments at 34% interest
 * - Current installment: $26,800
 * - Round UP to: $27,000
 * - Required interest: (($27,000 × 5 / $100,000) - 1) × 100 = 35%
 */

interface RoundingConfig {
  baseAmount: number;
  totalPayments: number;
  currentInterestRate: number;
}

interface RoundingResult {
  interestRate: number;
  installmentAmount: number;
  totalAmount: number;
}

/**
 * Calculate installment amount for a given interest rate
 */
function calculateInstallment(
  baseAmount: number,
  interestRate: number,
  totalPayments: number
): number {
  const totalWithInterest = baseAmount * (1 + interestRate / 100);
  return totalWithInterest / totalPayments;
}

/**
 * Calculate interest rate needed to achieve target installment amount
 * Formula: interest = ((targetInstallment × totalPayments / baseAmount) - 1) × 100
 */
function calculateRequiredInterest(
  baseAmount: number,
  targetInstallment: number,
  totalPayments: number
): number {
  const totalNeeded = targetInstallment * totalPayments;
  const requiredInterest = ((totalNeeded / baseAmount) - 1) * 100;
  return Math.max(0, requiredInterest);
}

/**
 * Determine the rounding increment based on installment magnitude
 * Examples:
 * - $26,800 → increment 1,000
 * - $5,400 → increment 500
 * - $1,200 → increment 100
 */
function getRoundingIncrement(installmentAmount: number): number {
  if (installmentAmount >= 10000) return 1000;
  if (installmentAmount >= 5000) return 500;
  if (installmentAmount >= 1000) return 100;
  if (installmentAmount >= 500) return 50;
  if (installmentAmount >= 100) return 10;
  return 1;
}

/**
 * Round a number UP to the nearest increment
 */
function roundUp(value: number, increment: number): number {
  return Math.ceil(value / increment) * increment;
}

/**
 * Round a number DOWN to the nearest increment
 */
function roundDown(value: number, increment: number): number {
  return Math.floor(value / increment) * increment;
}

/**
 * Find the best interest rate to round installment amount UPWARD
 * Searches for the next "nice" value above current installment
 */
export function findRoundedInterestRateUp(config: RoundingConfig): RoundingResult | null {
  const { baseAmount, totalPayments, currentInterestRate } = config;

  const currentInstallment = calculateInstallment(baseAmount, currentInterestRate, totalPayments);
  const increment = getRoundingIncrement(currentInstallment);

  // Find next rounded value UP
  const targetInstallment = roundUp(currentInstallment + 0.01, increment);

  // Calculate required interest
  const requiredInterest = calculateRequiredInterest(baseAmount, targetInstallment, totalPayments);

  return {
    interestRate: requiredInterest,
    installmentAmount: targetInstallment,
    totalAmount: targetInstallment * totalPayments,
  };
}

/**
 * Find the best interest rate to round installment amount DOWNWARD
 * Searches for the previous "nice" value below current installment
 */
export function findRoundedInterestRateDown(config: RoundingConfig): RoundingResult | null {
  const { baseAmount, totalPayments, currentInterestRate } = config;

  const currentInstallment = calculateInstallment(baseAmount, currentInterestRate, totalPayments);
  const increment = getRoundingIncrement(currentInstallment);

  // Find previous rounded value DOWN
  const targetInstallment = roundDown(currentInstallment - 0.01, increment);

  // Return null if target would be negative or zero
  if (targetInstallment <= 0) {
    return null;
  }

  // Calculate required interest
  const requiredInterest = calculateRequiredInterest(baseAmount, targetInstallment, totalPayments);

  return {
    interestRate: requiredInterest,
    installmentAmount: targetInstallment,
    totalAmount: targetInstallment * totalPayments,
  };
}

/**
 * Check if an installment amount is already "nice" (round number)
 * Returns true if the amount ends in 0 or is close to a round value
 */
export function isNiceRoundNumber(installmentAmount: number, tolerance: number = 50): boolean {
  const increment = getRoundingIncrement(installmentAmount);
  const rounded = Math.round(installmentAmount / increment) * increment;
  return Math.abs(installmentAmount - rounded) <= tolerance;
}
