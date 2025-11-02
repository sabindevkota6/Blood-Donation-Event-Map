import React from 'react';
import './Avatar.css';

function Avatar({ src, name, size = 'medium' }) {
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const sizeClass = `avatar-${size}`;

  return (
    <div className={`avatar ${sizeClass}`}>
      {src ? (
        <img src={src} alt={name} className="avatar-image" />
      ) : (
        <div className="avatar-initials">{getInitials(name)}</div>
      )}
    </div>
  );
}

export default Avatar;
