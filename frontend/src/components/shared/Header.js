// src/components/shared/Header.jsx
import React from 'react';

const Header = ({ children }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        {children}
      </div>
    </header>
  );
};

export default Header;