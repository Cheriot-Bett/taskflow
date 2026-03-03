import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Generates random confetti pieces for the falling animation.
 * @param {number} count - Number of confetti pieces to generate
 * @returns {Array} Array of confetti piece objects
 */
function generateConfetti(count) {
  const colors = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
    '#ff922b', '#cc5de8', '#f06595', '#20c997',
    '#a9e34b', '#74c0fc',
  ];
  const shapes = ['circle', 'square', 'triangle'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 10 + 8}px`,
    delay: `${Math.random() * 5}s`,
    duration: `${Math.random() * 3 + 3}s`,
    rotation: `${Math.random() * 360}deg`,
    drift: `${(Math.random() - 0.5) * 120}px`,
  }));
}

/**
 * Generates random bubble decorations.
 * @param {number} count - Number of bubbles to generate
 * @returns {Array} Array of bubble objects
 */
function generateBubbles(count) {
  const colors = [
    'rgba(255,107,107,0.35)', 'rgba(255,217,61,0.35)',
    'rgba(107,203,119,0.35)', 'rgba(77,150,255,0.35)',
    'rgba(204,93,232,0.35)', 'rgba(240,101,149,0.35)',
    'rgba(32,201,151,0.35)', 'rgba(255,146,43,0.35)',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: `${Math.random() * 80 + 30}px`,
    left: `${Math.random() * 95}%`,
    top: `${Math.random() * 95}%`,
    delay: `${Math.random() * 4}s`,
    duration: `${Math.random() * 4 + 4}s`,
  }));
}

/** Individual confetti piece rendered as CSS shapes */
function ConfettiPiece({ piece }) {
  const style = {
    position: 'fixed',
    left: piece.left,
    top: '-20px',
    width: piece.size,
    height: piece.size,
    backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
    borderLeft: piece.shape === 'triangle' ? `${parseInt(piece.size) / 2}px solid transparent` : undefined,
    borderRight: piece.shape === 'triangle' ? `${parseInt(piece.size) / 2}px solid transparent` : undefined,
    borderBottom: piece.shape === 'triangle' ? `${parseInt(piece.size)}px solid ${piece.color}` : undefined,
    borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '0',
    animation: `confettiFall ${piece.duration} ${piece.delay} infinite linear`,
    '--drift': piece.drift,
    '--rotation': piece.rotation,
    zIndex: 10,
    pointerEvents: 'none',
  };
  return <div style={style} />;
}

/** Floating bubble decoration */
function Bubble({ bubble }) {
  const style = {
    position: 'fixed',
    left: bubble.left,
    top: bubble.top,
    width: bubble.size,
    height: bubble.size,
    backgroundColor: bubble.color,
    borderRadius: '50%',
    border: `2px solid ${bubble.color.replace('0.35', '0.6')}`,
    animation: `bubbleFloat ${bubble.duration} ${bubble.delay} infinite ease-in-out`,
    zIndex: 5,
    pointerEvents: 'none',
    backdropFilter: 'blur(2px)',
  };
  return <div style={style} />;
}

/** The main birthday letter, animated in with a staggered reveal */
function BirthdayMessage() {
  const text = "Happy Birthday Zinnette!";
  const colors = [
    '#ff6b6b','#ff922b','#ffd93d','#a9e34b',
    '#6bcb77','#20c997','#4d96ff','#74c0fc',
    '#cc5de8','#f06595','#ff6b6b','#ff922b',
    '#ffd93d','#a9e34b','#6bcb77','#20c997',
    '#4d96ff','#74c0fc','#cc5de8','#f06595',
    '#ff6b6b','#ff922b','#ffd93d','#a9e34b',
  ];

  return (
    <div style={{ textAlign: 'center', animation: 'messageReveal 0.8s ease-out forwards' }}>
      <div style={{ fontSize: 'clamp(2rem, 8vw, 5rem)', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.1 }}>
        {text.split('').map((char, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              color: colors[i % colors.length],
              animation: `letterDance 1.2s ${i * 0.07}s infinite ease-in-out`,
              textShadow: `0 0 20px ${colors[i % colors.length]}88, 0 4px 8px rgba(0,0,0,0.2)`,
              filter: 'drop-shadow(0 0 8px currentColor)',
              whiteSpace: char === ' ' ? 'pre' : 'normal',
            }}
          >
            {char === ' ' ? '\u00a0' : char}
          </span>
        ))}
      </div>
      <div style={{
        marginTop: '1.5rem',
        fontSize: 'clamp(1.5rem, 5vw, 3rem)',
        animation: 'emojiSpin 2s infinite',
        display: 'inline-block',
      }}>
        🎂🎉🥳🎈🎁🪄✨
      </div>
      <p style={{
        marginTop: '1rem',
        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
        color: '#fff',
        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
        fontWeight: 600,
        animation: 'fadeSlideUp 1s 0.5s both',
      }}>
        Wishing you the most magical day! 🌟
      </p>
    </div>
  );
}

/**
 * BirthdayPage — Interactive birthday animation page for Zinnette.
 * Features: continuous bubbles, confetti rain, reveal button.
 */
export default function BirthdayPage() {
  const [revealed, setRevealed] = useState(false);
  const [confetti] = useState(() => generateConfetti(60));
  const [bubbles] = useState(() => generateBubbles(18));
  const [buttonPulse, setButtonPulse] = useState(false);

  /** Trigger button press effect and reveal message */
  const handleReveal = useCallback(() => {
    setButtonPulse(true);
    setTimeout(() => setButtonPulse(false), 400);
    setRevealed(true);
  }, []);

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-20px) scale(1.08); }
        }
        @keyframes letterDance {
          0%, 100% { transform: translateY(0) rotate(-3deg) scale(1); }
          50%       { transform: translateY(-12px) rotate(3deg) scale(1.1); }
        }
        @keyframes messageReveal {
          from { opacity: 0; transform: scale(0.5) rotate(-5deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes emojiSpin {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50%       { transform: rotate(8deg) scale(1.15); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bgShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes buttonGlow {
          0%, 100% { box-shadow: 0 0 20px #ff6b6b88, 0 8px 32px rgba(0,0,0,0.3); }
          50%       { box-shadow: 0 0 40px #ff6b6bcc, 0 8px 48px rgba(0,0,0,0.4); }
        }
        @keyframes buttonPulseAnim {
          0%   { transform: scale(1); }
          50%  { transform: scale(0.94); }
          100% { transform: scale(1); }
        }
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>

      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #1a1a2e)',
        backgroundSize: '400% 400%',
        animation: 'bgShift 12s ease infinite',
        zIndex: 0,
      }} />

      {/* Bubbles */}
      {bubbles.map(b => <Bubble key={b.id} bubble={b} />)}

      {/* Confetti */}
      {confetti.map(p => <ConfettiPiece key={p.id} piece={p} />)}

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 20,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        {/* Page title (always visible) */}
        <div style={{
          marginBottom: revealed ? '3rem' : '4rem',
          textAlign: 'center',
          animation: 'titleFloat 3s ease-in-out infinite',
        }}>
          <div style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', marginBottom: '0.5rem' }}>🎂</div>
          <h1 style={{
            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
            {revealed ? 'A special message awaits you...' : 'A surprise is waiting for you!'}
          </h1>
        </div>

        {/* Reveal button */}
        {!revealed && (
          <button
            onClick={handleReveal}
            style={{
              padding: '1.2rem 3.5rem',
              fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
              fontWeight: 800,
              color: '#fff',
              background: 'linear-gradient(135deg, #ff6b6b, #ff922b, #ffd93d, #6bcb77, #4d96ff, #cc5de8)',
              backgroundSize: '300% 300%',
              animation: `bgShift 4s ease infinite, buttonGlow 2s ease-in-out infinite${buttonPulse ? ', buttonPulseAnim 0.4s ease' : ''}`,
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              letterSpacing: '0.03em',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'transform 0.1s',
              outline: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🎉 Click to Reveal! 🎉
          </button>
        )}

        {/* Revealed birthday message */}
        {revealed && (
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: 'clamp(1.5rem, 5vw, 3rem)',
            maxWidth: '900px',
            width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            <BirthdayMessage />
          </div>
        )}

        {/* Reset link */}
        {revealed && (
          <button
            onClick={() => setRevealed(false)}
            style={{
              marginTop: '2rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: '20px',
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          >
            ↩ Reveal Again
          </button>
        )}
      </div>
    </>
  );
}
