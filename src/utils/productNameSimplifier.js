// Utility to simplify product names for dashboard and TPV display
// Maps detailed product names to simple category names

export const getSimplifiedProductName = (productId, fullName) => {
  // Category mapping based on product ID prefixes and patterns
  const categoryMappings = {
    'heat-pump': 'Heat Pump',
    'furnace': 'Furnace',
    'ac-central': 'Air Conditioner',
    'navien-tankless': 'Tankless Water Heater',
    'cv40': 'Water Heater',
    'cv50': 'Water Heater',
    'pv40': 'Water Heater',
    'pv50': 'Water Heater',
    'hot-water-tank': 'Electric Water Heater',
    'rheem-proterra': 'Heat Pump Water Heater',
    'ductwork': 'Ductwork',
    'hvac-maintenance': 'HVAC Maintenance',
    'thermostat-programmable': 'Thermostat',
    'thermostat-smart': 'Smart Thermostat',
    'home-energy-audit': 'Energy Audit',
    'attic-insulation': 'Insulation',
    'smart-home-battery': 'Battery',
    'carbon-filter': 'Water Filter',
    'water-softener': 'Water Softener',
    'hepa-filter': 'Air Filter',
    'electronic-air-cleaner': 'Air Cleaner'
  };

  // Try to match by product ID prefix
  if (productId) {
    for (const [prefix, simpleName] of Object.entries(categoryMappings)) {
      if (productId.startsWith(prefix) || productId === prefix) {
        return simpleName;
      }
    }
  }

  // Fallback: extract category from full name if productId doesn't match
  if (fullName) {
    const lowerName = fullName.toLowerCase();
    if (lowerName.includes('heat pump')) return 'Heat Pump';
    if (lowerName.includes('furnace')) return 'Furnace';
    if (lowerName.includes('air condition') || lowerName.includes('central ac')) return 'Air Conditioner';
    if (lowerName.includes('tankless')) return 'Tankless Water Heater';
    if (lowerName.includes('water heater') || lowerName.includes('hot water')) return 'Water Heater';
    if (lowerName.includes('thermostat')) return 'Thermostat';
    if (lowerName.includes('insulation')) return 'Insulation';
    if (lowerName.includes('battery')) return 'Battery';
    if (lowerName.includes('solar')) return 'Solar';
    if (lowerName.includes('ductwork')) return 'Ductwork';
    if (lowerName.includes('filter')) return 'Filter';
    if (lowerName.includes('softener')) return 'Water Softener';
  }

  // Last resort: return custom or the original name
  return productId === 'custom' ? (fullName || 'Custom Product') : (fullName || 'Product');
};

// Get simplified names for multiple items
export const getSimplifiedProductList = (items) => {
  if (!items || items.length === 0) return '';
  
  const simplifiedNames = items
    .filter(item => item.name || item.productId)
    .map(item => getSimplifiedProductName(item.productId, item.name));
  
  // Remove duplicates and join
  const uniqueNames = [...new Set(simplifiedNames)];
  return uniqueNames.join(', ');
};

// Group products by category for TPV display
export const groupProductsByCategory = (items) => {
  const groups = {
    'HVAC': [],
    'Insulation': [],
    'Solar/Battery': [],
    'Other': []
  };

  items.forEach(item => {
    const simplified = getSimplifiedProductName(item.productId, item.name);
    
    if (['Heat Pump', 'Furnace', 'Air Conditioner', 'Ductwork', 'Thermostat', 'Smart Thermostat', 'Air Filter', 'Air Cleaner', 'Water Heater', 'Tankless Water Heater', 'Electric Water Heater', 'Heat Pump Water Heater'].includes(simplified)) {
      groups['HVAC'].push({ ...item, simplifiedName: simplified });
    } else if (simplified === 'Insulation') {
      groups['Insulation'].push({ ...item, simplifiedName: simplified });
    } else if (['Solar', 'Battery'].includes(simplified)) {
      groups['Solar/Battery'].push({ ...item, simplifiedName: simplified });
    } else {
      groups['Other'].push({ ...item, simplifiedName: simplified });
    }
  });

  return groups;
};
