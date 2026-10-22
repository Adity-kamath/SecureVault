import React from 'react';
import zxcvbn from 'zxcvbn';

const LiveStrengthMeter = ({ password = '', userInputs = [] }) => {
  if (!password) return null;

  const result = zxcvbn(password, userInputs);
  const score = result.score; // 0 to 4

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const label = labels[score];

  const getSegmentClass = (segmentIndex) => {
    if (segmentIndex > score) return '';
    if (score <= 1) return 'active-weak';
    if (score === 2) return 'active-fair';
    return 'active-strong';
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <div className="strength-meter-bar">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`strength-segment ${getSegmentClass(index)}`}
          />
        ))}
      </div>
      <div className="strength-feedback">
        <span style={{ fontWeight: 600, color: score < 2 ? '#ef4444' : score === 2 ? '#f59e0b' : '#10b981' }}>
          {label} — {password.length} characters
        </span>
        {result.feedback.warning ? (
          <span style={{ color: '#ef4444' }}>{result.feedback.warning}</span>
        ) : (
          <span>Estimated crack time: {result.crack_times_display.offline_slow_hashing_1e4_per_second}</span>
        )}
      </div>
    </div>
  );
};

export default LiveStrengthMeter;
