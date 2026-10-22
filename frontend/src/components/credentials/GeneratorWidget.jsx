import React, { useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';

const GeneratorWidget = ({ onSelectPassword }) => {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += charset[array[i] % charset.length];
    }

    setGenerated(pass);
    if (onSelectPassword) {
      onSelectPassword(pass);
    }
  };

  return (
    <div className="card" style={{ padding: '20px', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Generator</h4>
        <button
          type="button"
          onClick={generate}
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 8px', borderRadius: '8px' }}
          title="Regenerate Password"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
          <span style={{ color: '#64748b', fontWeight: 500 }}>Length</span>
          <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '12px' }}>
            {length} chars
          </span>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#0f766e', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setUseUpper(!useUpper)}
          className={`btn btn-sm ${useUpper ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '6px', fontSize: '12px' }}
        >
          A–z
        </button>
        <button
          type="button"
          onClick={() => setUseNumbers(!useNumbers)}
          className={`btn btn-sm ${useNumbers ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '6px', fontSize: '12px' }}
        >
          0–9
        </button>
        <button
          type="button"
          onClick={() => setUseSymbols(!useSymbols)}
          className={`btn btn-sm ${useSymbols ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '6px', fontSize: '12px' }}
        >
          #$%
        </button>
      </div>

      <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4, marginBottom: '14px' }}>
        All character groups are enabled for a high-entropy password.
      </p>

      <button
        type="button"
        onClick={generate}
        className="btn btn-secondary btn-sm"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Generate & Insert
      </button>
    </div>
  );
};

export default GeneratorWidget;
