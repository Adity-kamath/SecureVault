/**
 * Company configuration — edit the COMPANY_DOMAIN value below
 * to change the allowed email domain across the entire application.
 *
 * Example: 'company.com' → only emails like john@company.com are accepted.
 */

export const COMPANY_DOMAIN = 'company.com';

export const COMPANY_NAME = 'Acme Technologies';

/**
 * Returns true if the email ends with @COMPANY_DOMAIN (case-insensitive).
 */
export const isCompanyEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith(`@${COMPANY_DOMAIN.toLowerCase()}`);
};

/**
 * Returns a human-readable validation message.
 */
export const companyEmailError = () =>
  `Only company emails are allowed (e.g. name@${COMPANY_DOMAIN})`;
