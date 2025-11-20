/*
 * Avatar component: simple user avatar display
 * Falls back to initials if image is unavailable and supports size variations.
 */
import React from 'react';
import './Avatar.css';

function Avatar({ src, name, size = 'medium' }) {
  // Extract initials from a full name for fallback avatar
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const sizeClass = `avatar-${size}`;
  const isCustomSize = size.includes('px');
  const customStyle = isCustomSize ? {
    width: size,
    height: size,
    fontSize: `${parseInt(size) * 0.4}px`
  } : {};

  return (
    <div className={`avatar ${!isCustomSize ? sizeClass : ''}`} style={customStyle}>
      {src ? (
        <img src={src} alt={name} className="avatar-image" />
      ) : (
        <div className="avatar-initials">{getInitials(name)}</div>
      )}
    </div>
  );
}

export default Avatar;
