/**
 * Company configuration — edit COMPANY_DOMAIN below to change the
 * allowed email domain across the entire backend.
 *
 * Example: 'company.com' → only emails like john@company.com are accepted.
 */

const COMPANY_DOMAIN = 'company.com';

/**
 * Returns true if the email ends with @COMPANY_DOMAIN (case-insensitive).
 */
const isCompanyEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith(`@${COMPANY_DOMAIN.toLowerCase()}`);
};

/**
 * Returns a human-readable validation message.
 */
const companyEmailError = () =>
  `Only company emails are allowed (e.g. name@${COMPANY_DOMAIN})`;

module.exports = {
  COMPANY_DOMAIN,
  isCompanyEmail,
  companyEmailError
};
