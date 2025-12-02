import React from 'react';

const BaseTemplate = ({ data, children }) => {
  return (
    <div
      className="bg-white mx-auto"
      style={{ 
        width: "100%", 
        maxWidth: "794px",
        minHeight: "1123px",
        padding: "18px", // 0.25 inches = 18px at 72 DPI
        boxSizing: "border-box"
      }}
    >
      {children}
    </div>
  );
};

export default BaseTemplate;
