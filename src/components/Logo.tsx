import React, { useState } from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  const [error, setError] = useState(false);
  const logoUrl = "https://frequent-gray-pc1cte2wpe.edgeone.app/cropped_circle_image.png";

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-primary rounded-full ${className}`}>
        <span className="text-white font-serif font-bold text-[40%]">M</span>
      </div>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt="Manbhari Logo" 
      className={`cursor-pointer object-contain ${className}`}
      referrerPolicy="no-referrer"
      onError={() => {
        console.error("Logo failed to load");
        setError(true);
      }}
    />
  );
};
