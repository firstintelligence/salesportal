export const hvacProducts = [
  // Heat Pumps
  {
    id: 'heat-pump-standard',
    name: 'Standard Heat Pump System',
    description: 'High-efficiency heat pump for residential use',
    basePrice: 12500,
    category: 'Heat Pumps'
  },
  {
    id: 'heat-pump-premium',
    name: 'Premium Heat Pump System',
    description: 'Ultra-high efficiency heat pump with advanced features',
    basePrice: 16500,
    category: 'Heat Pumps'
  },
  {
    id: 'heat-pump-commercial',
    name: 'Commercial Heat Pump System',
    description: 'Heavy-duty heat pump for commercial applications',
    basePrice: 22000,
    category: 'Heat Pumps'
  },
  {
    id: 'heat-pump-mini-split',
    name: 'Mini-Split Heat Pump System',
    description: 'Ductless mini-split heat pump system',
    basePrice: 8500,
    category: 'Heat Pumps'
  },
  
  // Furnaces
  {
    id: 'furnace-gas-80',
    name: 'Gas Furnace 80% AFUE',
    description: '80% efficiency natural gas furnace',
    basePrice: 4500,
    category: 'Furnaces'
  },
  {
    id: 'furnace-gas-95',
    name: 'Gas Furnace 95% AFUE',
    description: '95% high-efficiency condensing gas furnace',
    basePrice: 7500,
    category: 'Furnaces'
  },
  
  // Air Conditioning
  {
    id: 'ac-central-14-seer',
    name: 'Central AC 14 SEER',
    description: '14 SEER central air conditioning system',
    basePrice: 5500,
    category: 'Air Conditioning'
  },
  {
    id: 'ac-central-16-seer',
    name: 'Central AC 16 SEER',
    description: '16 SEER high-efficiency central air conditioning',
    basePrice: 7500,
    category: 'Air Conditioning'
  },
  
  // Water Heating - Tankless by BTU/Bathrooms
  {
    id: 'tankless-1-2-bath',
    name: 'Tankless Water Heater (1-2 Bathrooms)',
    description: '120,000 BTU tankless water heater for 1-2 bathrooms',
    basePrice: 3500,
    category: 'Water Heating'
  },
  {
    id: 'tankless-2-3-bath',
    name: 'Tankless Water Heater (2-3 Bathrooms)',
    description: '160,000 BTU tankless water heater for 2-3 bathrooms',
    basePrice: 4200,
    category: 'Water Heating'
  },
  {
    id: 'tankless-3-4-bath',
    name: 'Tankless Water Heater (3-4 Bathrooms)',
    description: '199,000 BTU tankless water heater for 3-4 bathrooms',
    basePrice: 4800,
    category: 'Water Heating'
  },
  {
    id: 'tankless-4-plus-bath',
    name: 'Tankless Water Heater (4+ Bathrooms)',
    description: '240,000 BTU tankless water heater for 4+ bathrooms',
    basePrice: 5500,
    category: 'Water Heating'
  },
  
  // Hot Water Tanks
  {
    id: 'hot-water-tank-40',
    name: '40 Gallon Hot Water Tank',
    description: '40-gallon conventional hot water tank',
    basePrice: 1800,
    category: 'Water Heating'
  },
  {
    id: 'hot-water-tank-60',
    name: '60 Gallon Hot Water Tank',
    description: '60-gallon conventional hot water tank',
    basePrice: 2200,
    category: 'Water Heating'
  },
  {
    id: 'cv40',
    name: 'CV40 Hot Water Tank',
    description: 'CV40 high-efficiency hot water tank',
    basePrice: 2800,
    category: 'Water Heating'
  },
  {
    id: 'cv50',
    name: 'CV50 Hot Water Tank',
    description: 'CV50 high-efficiency hot water tank',
    basePrice: 3200,
    category: 'Water Heating'
  },
  {
    id: 'pv40',
    name: 'PV40 Power Vent Hot Water Tank',
    description: 'PV40 power vent hot water tank',
    basePrice: 3500,
    category: 'Water Heating'
  },
  {
    id: 'pv50',
    name: 'PV50 Power Vent Hot Water Tank',
    description: 'PV50 power vent hot water tank',
    basePrice: 3800,
    category: 'Water Heating'
  },
  
  // Installation & Insulation
  {
    id: 'ductwork-installation',
    name: 'Ductwork Installation',
    description: 'Complete ductwork system installation',
    basePrice: 4500,
    category: 'Installation'
  },
  {
    id: 'attic-insulation',
    name: 'Attic Insulation',
    description: 'Professional attic insulation installation',
    basePrice: 2800,
    category: 'Installation'
  },
  
  // Energy Storage
  {
    id: 'home-battery-5kw',
    name: 'Smart Storage Home Battery (5kW)',
    description: '5kW smart home battery storage system',
    basePrice: 8500,
    category: 'Energy Storage'
  },
  
  // Service & Controls
  {
    id: 'hvac-maintenance',
    name: 'HVAC Maintenance Package',
    description: 'Annual HVAC system maintenance and tune-up',
    basePrice: 450,
    category: 'Service'
  },
  {
    id: 'thermostat-programmable',
    name: 'Programmable Thermostat',
    description: 'Digital programmable thermostat installation',
    basePrice: 550,
    category: 'Controls'
  },
  {
    id: 'thermostat-smart',
    name: 'Smart Thermostat',
    description: 'Wi-Fi enabled smart thermostat with app control',
    basePrice: 750,
    category: 'Controls'
  },
  {
    id: 'home-energy-assessment',
    name: 'Home Energy Assessment',
    description: 'Comprehensive energy audit and efficiency analysis',
    basePrice: 750,
    category: 'Service'
  }
];

export const getProductsByCategory = () => {
  const categories = {};
  hvacProducts.forEach(product => {
    if (!categories[product.category]) {
      categories[product.category] = [];
    }
    categories[product.category].push(product);
  });
  return categories;
};