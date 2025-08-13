export const hvacProducts = [
  {
    id: 'heat-pump-residential-basic',
    name: 'Residential Heat Pump - Basic',
    description: 'High-efficiency heat pump system for residential use (14 SEER)',
    basePrice: 12500,
    category: 'Heat Pumps'
  },
  {
    id: 'heat-pump-residential-premium',
    name: 'Residential Heat Pump - Premium',
    description: 'High-efficiency heat pump system for residential use (16 SEER)',
    basePrice: 15500,
    category: 'Heat Pumps'
  },
  {
    id: 'heat-pump-residential-ultra',
    name: 'Residential Heat Pump - Ultra',
    description: 'Ultra high-efficiency heat pump system for residential use (18+ SEER)',
    basePrice: 18500,
    category: 'Heat Pumps'
  },
  {
    id: 'heat-pump-commercial',
    name: 'Commercial Heat Pump',
    description: 'Heavy-duty heat pump system for commercial applications',
    basePrice: 22000,
    category: 'Heat Pumps'
  },
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
  {
    id: 'ac-central-14-seer',
    name: 'Central AC 14 SEER',
    description: '14 SEER central air conditioning system',
    basePrice: 6500,
    category: 'Air Conditioning'
  },
  {
    id: 'ac-central-16-seer',
    name: 'Central AC 16 SEER',
    description: '16 SEER high-efficiency central air conditioning',
    basePrice: 8500,
    category: 'Air Conditioning'
  },
  {
    id: 'tankless-gas-1-2-bath',
    name: 'Tankless Gas Water Heater (1-2 Bathrooms)',
    description: 'On-demand natural gas water heater, 120,000 BTU',
    basePrice: 3800,
    category: 'Water Heating'
  },
  {
    id: 'tankless-gas-2-3-bath',
    name: 'Tankless Gas Water Heater (2-3 Bathrooms)',
    description: 'On-demand natural gas water heater, 160,000 BTU',
    basePrice: 4500,
    category: 'Water Heating'
  },
  {
    id: 'tankless-gas-3-4-bath',
    name: 'Tankless Gas Water Heater (3-4 Bathrooms)',
    description: 'On-demand natural gas water heater, 199,000 BTU',
    basePrice: 5200,
    category: 'Water Heating'
  },
  {
    id: 'tankless-gas-4-plus-bath',
    name: 'Tankless Gas Water Heater (4+ Bathrooms)',
    description: 'On-demand natural gas water heater, 240,000 BTU',
    basePrice: 6200,
    category: 'Water Heating'
  },
  {
    id: 'tankless-electric-1-2-bath',
    name: 'Tankless Electric Water Heater (1-2 Bathrooms)',
    description: 'On-demand electric water heater, 18 kW',
    basePrice: 2800,
    category: 'Water Heating'
  },
  {
    id: 'tankless-electric-2-3-bath',
    name: 'Tankless Electric Water Heater (2-3 Bathrooms)',
    description: 'On-demand electric water heater, 24 kW',
    basePrice: 3400,
    category: 'Water Heating'
  },
  {
    id: 'cv40',
    name: 'CV40 - 40 Gallon Conventional Water Heater',
    description: '40-gallon natural gas conventional water heater',
    basePrice: 1800,
    category: 'Water Heating'
  },
  {
    id: 'cv50',
    name: 'CV50 - 50 Gallon Conventional Water Heater',
    description: '50-gallon natural gas conventional water heater',
    basePrice: 2100,
    category: 'Water Heating'
  },
  {
    id: 'pv40',
    name: 'PV40 - 40 Gallon Power Vent Water Heater',
    description: '40-gallon natural gas power vent water heater',
    basePrice: 2400,
    category: 'Water Heating'
  },
  {
    id: 'pv50',
    name: 'PV50 - 50 Gallon Power Vent Water Heater',
    description: '50-gallon natural gas power vent water heater',
    basePrice: 2700,
    category: 'Water Heating'
  },
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
    id: 'ductwork-installation',
    name: 'Ductwork Installation',
    description: 'Complete ductwork system installation',
    basePrice: 4500,
    category: 'Installation'
  },
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
    basePrice: 650,
    category: 'Controls'
  },
  {
    id: 'thermostat-smart',
    name: 'Smart Thermostat',
    description: 'Wi-Fi enabled smart thermostat with app control',
    basePrice: 850,
    category: 'Controls'
  },
  {
    id: 'home-energy-assessment',
    name: 'Home Energy Assessment',
    description: 'Comprehensive energy audit and efficiency analysis',
    basePrice: 950,
    category: 'Service'
  },
  {
    id: 'attic-insulation',
    name: 'Attic Insulation',
    description: 'Blown-in cellulose or fiberglass attic insulation (per sq ft)',
    basePrice: 3500,
    category: 'Energy Efficiency'
  },
  {
    id: 'smart-home-battery-5kw',
    name: 'Smart Storage Home Battery (5kW)',
    description: '5kW lithium-ion home battery storage system with smart controls',
    basePrice: 8500,
    category: 'Energy Storage'
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