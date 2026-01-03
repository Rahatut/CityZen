import React, { createContext, useState, useContext } from 'react';

const ComplaintContext = createContext();

export const useComplaint = () => useContext(ComplaintContext);

export const ComplaintProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationTime, setLocationTime] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [assignedAuthorities, setAssignedAuthorities] = useState([]); // New state for assigned authorities

  const resetState = () => {
    setImages([]);
    setLocation(null);
    setLocationTime(null);
    setTitle('');
    setDescription('');
    setSelectedCategory(null);
    setPrivacyEnabled(false);
    setAiResult(null);
    setAssignedAuthorities([]); // Reset assigned authorities
  };
  
  const value = {
    images,
    setImages,
    location,
    setLocation,
    locationTime,
    setLocationTime,
    aiResult,
    setAiResult,
    title,
    setTitle,
    description,
    setDescription,
    selectedCategory,
    setSelectedCategory,
    privacyEnabled,
    setPrivacyEnabled,
    assignedAuthorities,
    setAssignedAuthorities,
    resetState,
  };

  return (
    <ComplaintContext.Provider value={value}>
      {children}
    </ComplaintContext.Provider>
  );
};
