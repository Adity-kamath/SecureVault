const zxcvbn = require('zxcvbn');

/**
 * Evaluates password strength using zxcvbn library.
 * Returns score (0-4), label, crack time estimate, and security suggestions.
 *
 * @param {string} password - Password to score
 * @param {string[]} userInputs - User context (name, email, domain) to penalize if contained in password
 * @returns {object} Health breakdown
 */
const evaluatePassword = (password, userInputs = []) => {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      label: 'Very Weak',
      crackTimeDisplay: 'instant',
      warning: 'Password cannot be empty',
      suggestions: ['Choose a secure password with at least 12 characters']
    };
  }

  const result = zxcvbn(password, userInputs);

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  return {
    score: result.score,
    label: labels[result.score] || 'Fair',
    crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second || 'instant',
    warning: result.feedback.warning || (result.score < 3 ? 'Password could be easily guessed' : null),
    suggestions: result.feedback.suggestions.length > 0
      ? result.feedback.suggestions
      : (result.score < 3 ? ['Add more words, mix numbers and special symbols'] : [])
  };
};

module.exports = {
  evaluatePassword
};
