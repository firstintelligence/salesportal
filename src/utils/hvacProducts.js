export const hvacProducts = [
  // Heat Pumps by Tonnage
  {
    id: 'heat-pump-2-ton',
    name: '2 Ton Heat Pump (14 SEER, 24,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 12500,
    category: 'Heat Pumps',
    seer: 14,
    btu: 24000
  },
  {
    id: 'heat-pump-3-ton',
    name: '3 Ton Heat Pump (16 SEER, 36,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 15500,
    category: 'Heat Pumps',
    seer: 16,
    btu: 36000
  },
  {
    id: 'heat-pump-4-ton',
    name: '4 Ton Heat Pump (18 SEER, 48,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 18500,
    category: 'Heat Pumps',
    seer: 18,
    btu: 48000
  },
  {
    id: 'heat-pump-5-ton',
    name: '5 Ton Heat Pump (20 SEER, 60,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 22000,
    category: 'Heat Pumps',
    seer: 20,
    btu: 60000
  },
  
  // Furnaces with specified efficiency ratings
  {
    id: 'furnace-gas-95',
    name: 'Gas Furnace 95% AFUE (80,000 BTU)',
    description: '95% high-efficiency condensing gas furnace with variable speed blower and professional installation',
    basePrice: 6500,
    category: 'Furnaces',
    efficiency: 95,
    btu: 80000
  },
  {
    id: 'furnace-gas-96',
    name: 'Gas Furnace 96% AFUE (100,000 BTU)',
    description: '96% high-efficiency condensing gas furnace with variable speed blower and professional installation',
    basePrice: 7500,
    category: 'Furnaces',
    efficiency: 96,
    btu: 100000
  },
  {
    id: 'furnace-gas-98',
    name: 'Gas Furnace 98% AFUE (120,000 BTU)',
    description: '98% ultra high-efficiency condensing gas furnace with modulating burner and professional installation',
    basePrice: 9500,
    category: 'Furnaces',
    efficiency: 98,
    btu: 120000
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
  // Navien Tankless Water Heaters
  {
    id: 'navien-tankless-1-2-bath',
    name: 'Navien Tankless Water Heater (1-2 Bathrooms, 120,000 BTU)',
    description: 'Navien condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 5800,
    category: 'Water Heating',
    btu: 120000
  },
  {
    id: 'navien-tankless-2-3-bath',
    name: 'Navien Tankless Water Heater (2-3 Bathrooms, 160,000 BTU)',
    description: 'Navien condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 6500,
    category: 'Water Heating',
    btu: 160000
  },
  {
    id: 'navien-tankless-3-4-bath',
    name: 'Navien Tankless Water Heater (3-4 Bathrooms, 199,000 BTU)',
    description: 'Navien condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 7200,
    category: 'Water Heating',
    btu: 199000
  },
  {
    id: 'navien-tankless-4-plus-bath',
    name: 'Navien Tankless Water Heater (4+ Bathrooms, 240,000 BTU)',
    description: 'Navien condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 8200,
    category: 'Water Heating',
    btu: 240000
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
    id: 'home-energy-audit',
    name: 'Home Energy Audit',
    description: 'Comprehensive energy assessment including blower door test, thermal imaging, and efficiency recommendations',
    basePrice: 750,
    category: 'Service'
  },
  {
    id: 'attic-insulation-1000',
    name: 'Attic Insulation (up to 1000 sq ft)',
    description: 'Blown-in cellulose or fiberglass attic insulation for homes up to 1000 square feet',
    basePrice: 4500,
    category: 'Energy Efficiency'
  },
  {
    id: 'attic-insulation-1000-plus',
    name: 'Attic Insulation (1000+ sq ft)',
    description: 'Blown-in cellulose or fiberglass attic insulation for homes over 1000 square feet',
    basePrice: 6500,
    category: 'Energy Efficiency'
  },
  {
    id: 'smart-home-battery-5kw',
    name: 'Smart Storage Home Battery (5kW)',
    description: '5kW lithium-ion home battery storage system with smart controls',
    basePrice: 8500,
    category: 'Energy Storage'
  },
  
  // Water Filtration
  {
    id: 'carbon-filter',
    name: 'Carbon Water Filter',
    description: 'Whole house carbon filtration system with professional installation',
    basePrice: 1200,
    category: 'Water Filtration'
  },
  {
    id: 'water-softener',
    name: 'Water Softener System',
    description: 'Ion exchange water softener system with salt tank and professional installation',
    basePrice: 2800,
    category: 'Water Filtration'
  },
  
  // Air Filtration
  {
    id: 'hepa-filter',
    name: 'HEPA Filter System',
    description: 'High-efficiency particulate air filtration system for whole house air purification',
    basePrice: 1800,
    category: 'Air Filtration'
  },
  {
    id: 'electronic-air-cleaner',
    name: 'Electronic Air Cleaner (EAC)',
    description: 'Electronic air cleaner with washable filters for superior air quality',
    basePrice: 2200,
    category: 'Air Filtration'
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