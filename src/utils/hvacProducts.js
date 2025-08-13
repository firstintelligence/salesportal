export const hvacProducts = [
  {
    id: 'heat-pump-residential',
    name: 'Residential Heat Pump',
    description: 'High-efficiency heat pump system for residential use',
    basePrice: 8500,
    category: 'Heat Pumps'
  },
  {
    id: 'heat-pump-commercial',
    name: 'Commercial Heat Pump',
    description: 'Heavy-duty heat pump system for commercial applications',
    basePrice: 15000,
    category: 'Heat Pumps'
  },
  {
    id: 'furnace-gas-80',
    name: 'Gas Furnace 80% AFUE',
    description: '80% efficiency natural gas furnace',
    basePrice: 3500,
    category: 'Furnaces'
  },
  {
    id: 'furnace-gas-95',
    name: 'Gas Furnace 95% AFUE',
    description: '95% high-efficiency condensing gas furnace',
    basePrice: 5500,
    category: 'Furnaces'
  },
  {
    id: 'ac-central-14-seer',
    name: 'Central AC 14 SEER',
    description: '14 SEER central air conditioning system',
    basePrice: 4500,
    category: 'Air Conditioning'
  },
  {
    id: 'ac-central-16-seer',
    name: 'Central AC 16 SEER',
    description: '16 SEER high-efficiency central air conditioning',
    basePrice: 6000,
    category: 'Air Conditioning'
  },
  {
    id: 'tankless-gas',
    name: 'Tankless Gas Water Heater',
    description: 'On-demand natural gas water heater',
    basePrice: 2800,
    category: 'Water Heating'
  },
  {
    id: 'tankless-electric',
    name: 'Tankless Electric Water Heater',
    description: 'On-demand electric water heater',
    basePrice: 1800,
    category: 'Water Heating'
  },
  {
    id: 'hot-water-tank-40',
    name: '40 Gallon Hot Water Tank',
    description: '40-gallon conventional hot water tank',
    basePrice: 1200,
    category: 'Water Heating'
  },
  {
    id: 'hot-water-tank-60',
    name: '60 Gallon Hot Water Tank',
    description: '60-gallon conventional hot water tank',
    basePrice: 1500,
    category: 'Water Heating'
  },
  {
    id: 'ductwork-installation',
    name: 'Ductwork Installation',
    description: 'Complete ductwork system installation',
    basePrice: 3000,
    category: 'Installation'
  },
  {
    id: 'hvac-maintenance',
    name: 'HVAC Maintenance Package',
    description: 'Annual HVAC system maintenance and tune-up',
    basePrice: 350,
    category: 'Service'
  },
  {
    id: 'thermostat-programmable',
    name: 'Programmable Thermostat',
    description: 'Digital programmable thermostat installation',
    basePrice: 450,
    category: 'Controls'
  },
  {
    id: 'thermostat-smart',
    name: 'Smart Thermostat',
    description: 'Wi-Fi enabled smart thermostat with app control',
    basePrice: 650,
    category: 'Controls'
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