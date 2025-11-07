import React, { useState, useEffect } from 'react';

// Expanded to 10 styles to match new avatar picker requirements
const STYLES = ['bottts','micah','adventurer','pixel-art','avataaars','lorelei','notionists','personas','thumbs','fun-emoji'];

function AvatarPlayground({ initialSpec = null, onChange }) {
  const initial = initialSpec || { provider: 'dicebear', style: 'bottts', seed: '' };
  const [style, setStyle] = useState(initial.style || 'bottts');
  // We still keep seed internally for randomization, but we do not expose an input field anymore.
  const [seed, setSeed] = useState(initial.seed || '');
  const [debouncedSeed, setDebouncedSeed] = useState(seed);
  const [loading, setLoading] = useState(false);
  const [customImage, setCustomImage] = useState(null);

  // Debounce seed updates for preview
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setDebouncedSeed(seed);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [seed, style]);

  useEffect(() => {
    // Notify parent whenever the spec changes
    const spec = customImage
      ? { provider: 'custom', url: customImage }
      : { provider: 'dicebear', style, seed };
    onChange && onChange(spec);
  }, [style, seed, customImage, onChange]);

  const randomize = () => {
    const s = Math.random().toString(36).slice(2, 10);
    setSeed(s);
  };

  const previewUrl = (st, sd) => {
    const safeSeed = encodeURIComponent(sd || '');
    return `https://api.dicebear.com/6.x/${st}/svg?seed=${safeSeed}`;
  };

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 280 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {STYLES.map(s => (
            <button key={s} onClick={() => { setStyle(s); customImage && setCustomImage(null); }} type="button" style={{ border: style === s && !customImage ? '2px solid #37B300' : '1px solid #ddd', padding: 6, borderRadius: 10, background: 'white' }}>
              <img src={previewUrl(s, seed || 'preview')} alt={s} style={{ width: 60, height: 60 }} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={randomize} style={{ padding: '10px 14px', borderRadius: 12, background: '#58CC02', color: 'white', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>🎲 Random</button>
          <label style={{ padding: '10px 14px', borderRadius: 12, background: customImage ? '#1CB0F6' : '#FFFFFF', color: customImage ? 'white' : '#1F2937', border: '2px solid #1CB0F6', fontWeight: 700, cursor: 'pointer' }}>
            {customImage ? 'Change Image' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setCustomImage(ev.target.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
          {customImage && (
            <button type="button" onClick={() => setCustomImage(null)} style={{ padding: '10px 14px', borderRadius: 12, background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
          )}
        </div>
      </div>
      <div style={{ minWidth: 160, textAlign: 'center' }}>
        <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', marginBottom: 12, border: '2px solid #37B300', background: '#fff', display: 'inline-block', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
          {customImage ? (
            <img src={customImage} alt="custom avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <img src={previewUrl(style, debouncedSeed || (initial.seed || ''))} alt="avatar preview" style={{ width: '100%', height: '100%', display: 'block' }} />
          )}
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>
          {customImage ? 'Custom Image' : (loading ? 'Updating…' : `${style}`)}
        </div>
      </div>
    </div>
  );
}

export default AvatarPlayground;
