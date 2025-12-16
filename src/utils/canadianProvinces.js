// Shared Canadian provinces data for consistent dropdown usage across the CRM
export const canadianProvinces = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' }
];

// Get full province name from code
export const getProvinceName = (code) => {
  const province = canadianProvinces.find(p => p.code === code);
  return province ? province.name : code;
};

// Get province code from name
export const getProvinceCode = (name) => {
  const province = canadianProvinces.find(p => p.name === name);
  return province ? province.code : name;
};
