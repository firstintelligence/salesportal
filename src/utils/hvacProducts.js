export const hvacProducts = [
  // Heat Pumps by Tonnage
  {
    id: 'heat-pump-2-ton',
    name: '2 Ton Heat Pump (24,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 12500,
    category: 'Heat Pumps',
    btu: 24000
  },
  {
    id: 'heat-pump-3-ton',
    name: '3 Ton Heat Pump (36,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 13500,
    category: 'Heat Pumps',
    btu: 36000
  },
  {
    id: 'heat-pump-4-ton',
    name: '4 Ton Heat Pump (48,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 14500,
    category: 'Heat Pumps',
    btu: 48000
  },
  {
    id: 'heat-pump-5-ton',
    name: '5 Ton Heat Pump (60,000 BTU)',
    description: 'Outdoor Unit\nIndoor Coil\nSmart Thermostat\nSnow Stand\nElectrical Hookup\nProfessional Installation',
    basePrice: 15500,
    category: 'Heat Pumps',
    btu: 60000
  },
  
  // Ductless Heat Pumps
  {
    id: 'ductless-heat-pump-1-head',
    name: '1 Head Ductless Heat Pump',
    description: 'Single zone ductless mini-split heat pump with professional installation',
    basePrice: 12000,
    category: 'Heat Pumps'
  },
  {
    id: 'ductless-heat-pump-2-head',
    name: '2 Head Ductless Heat Pump',
    description: 'Dual zone ductless mini-split heat pump with professional installation',
    basePrice: 16000,
    category: 'Heat Pumps'
  },
  {
    id: 'ductless-heat-pump-3-head',
    name: '3 Head Ductless Heat Pump',
    description: 'Triple zone ductless mini-split heat pump with professional installation',
    basePrice: 22000,
    category: 'Heat Pumps'
  },
  
  // Furnaces - All 95% AFUE
  {
    id: 'furnace-gas-40k',
    name: 'Gas Furnace 95% AFUE (40,000 BTU)',
    description: '95% high-efficiency condensing gas furnace with variable speed blower and professional installation',
    basePrice: 4000,
    category: 'Furnaces',
    efficiency: 95,
    btu: 40000
  },
  {
    id: 'furnace-gas-60k',
    name: 'Gas Furnace 95% AFUE (60,000 BTU)',
    description: '95% high-efficiency condensing gas furnace with variable speed blower and professional installation',
    basePrice: 6000,
    category: 'Furnaces',
    efficiency: 95,
    btu: 60000
  },
  {
    id: 'furnace-gas-80k',
    name: 'Gas Furnace 95% AFUE (80,000 BTU)',
    description: '95% high-efficiency condensing gas furnace with variable speed blower and professional installation',
    basePrice: 8000,
    category: 'Furnaces',
    efficiency: 95,
    btu: 80000
  },
  {
    id: 'furnace-gas-100k',
    name: 'Gas Furnace 95% AFUE (100,000 BTU)',
    description: '95% high-efficiency condensing gas furnace with variable speed blower and professional installation',
    basePrice: 10000,
    category: 'Furnaces',
    efficiency: 95,
    btu: 100000
  },
  {
    id: 'furnace-gas-120k',
    name: 'Gas Furnace 95% AFUE (120,000 BTU)',
    description: '95% high-efficiency condensing gas furnace with variable speed blower and professional installation',
    basePrice: 12000,
    category: 'Furnaces',
    efficiency: 95,
    btu: 120000
  },
  
  // Air Conditioning
  {
    id: 'ac-central-14-seer',
    name: 'Central AC 14 SEER',
    description: '14 SEER central air conditioning system',
    basePrice: 4000,
    category: 'Air Conditioning'
  },
  {
    id: 'ac-central-16-seer',
    name: 'Central AC 16 SEER',
    description: '16 SEER high-efficiency central air conditioning',
    basePrice: 6000,
    category: 'Air Conditioning'
  },
  
  // Tankless Water Heaters
  {
    id: 'tankless-1-2-bath',
    name: 'Tankless Water Heater (1-2 Baths, 120,000 BTU)',
    description: 'Condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 5800,
    category: 'Water Heating',
    btu: 120000
  },
  {
    id: 'tankless-2-3-bath',
    name: 'Tankless Water Heater (2-3 Baths, 150,000 BTU)',
    description: 'Condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 6500,
    category: 'Water Heating',
    btu: 150000
  },
  {
    id: 'tankless-3-4-bath',
    name: 'Tankless Water Heater (3-4 Baths, 180,000 BTU)',
    description: 'Condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 7200,
    category: 'Water Heating',
    btu: 180000
  },
  {
    id: 'tankless-4-plus-bath',
    name: 'Tankless Water Heater (4+ Baths, 210,000 BTU)',
    description: 'Condensing tankless water heater with recirculation pump and professional installation',
    basePrice: 8200,
    category: 'Water Heating',
    btu: 210000
  },
  
  // Conventional Water Heaters
  {
    id: 'cv40',
    name: 'CV40 - 40 Gallon Conventional Water Heater',
    description: '40-gallon natural gas conventional water heater',
    basePrice: 4000,
    category: 'Water Heating'
  },
  {
    id: 'cv50',
    name: 'CV50 - 50 Gallon Conventional Water Heater',
    description: '50-gallon natural gas conventional water heater',
    basePrice: 5000,
    category: 'Water Heating'
  },
  {
    id: 'cv60',
    name: 'CV60 - 60 Gallon Conventional Water Heater',
    description: '60-gallon natural gas conventional water heater',
    basePrice: 6000,
    category: 'Water Heating'
  },
  
  // Power Vent Water Heaters
  {
    id: 'pv40',
    name: 'PV40 - 40 Gallon Power Vent Water Heater',
    description: '40-gallon natural gas power vent water heater',
    basePrice: 4500,
    category: 'Water Heating'
  },
  {
    id: 'pv50',
    name: 'PV50 - 50 Gallon Power Vent Water Heater',
    description: '50-gallon natural gas power vent water heater',
    basePrice: 5500,
    category: 'Water Heating'
  },
  {
    id: 'pv60',
    name: 'PV60 - 60 Gallon Power Vent Water Heater',
    description: '60-gallon natural gas power vent water heater',
    basePrice: 6500,
    category: 'Water Heating'
  },
  
  // Electric Water Heaters
  {
    id: 'hot-water-tank-40-electric',
    name: '40 Gallon Electric Hot Water Tank',
    description: '40-gallon electric hot water tank',
    basePrice: 4000,
    category: 'Water Heating'
  },
  {
    id: 'hot-water-tank-50-electric',
    name: '50 Gallon Electric Hot Water Tank',
    description: '50-gallon electric hot water tank',
    basePrice: 5000,
    category: 'Water Heating'
  },
  {
    id: 'hot-water-tank-60-electric',
    name: '60 Gallon Electric Hot Water Tank',
    description: '60-gallon electric hot water tank',
    basePrice: 6000,
    category: 'Water Heating'
  },
  
  // Energy Efficiency
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
    id: 'air-sealing-draft-proofing',
    name: 'Air Sealing / Draft Proofing',
    description: 'Complete air sealing and draft proofing service to reduce energy loss',
    basePrice: 5000,
    category: 'Energy Efficiency'
  },
  
  // Energy Storage
  {
    id: 'smart-home-battery-10-12kw',
    name: 'Smart Storage Home Battery (10-12 kW)',
    description: '10-12kW lithium-ion home battery storage system with smart controls',
    basePrice: 30000,
    category: 'Energy Storage'
  },
  {
    id: 'smart-home-battery-15-16kw',
    name: 'Smart Storage Home Battery (15-16 kW)',
    description: '15-16kW lithium-ion home battery storage system with smart controls',
    basePrice: 35000,
    category: 'Energy Storage'
  },
  {
    id: 'smart-home-battery-20kw',
    name: 'Smart Storage Home Battery (20 kW)',
    description: '20kW lithium-ion home battery storage system with smart controls',
    basePrice: 40000,
    category: 'Energy Storage'
  },
  
  // Water Filtration
  {
    id: 'carbon-filter',
    name: 'Carbon Water Filter',
    description: 'Whole house carbon filtration system with professional installation',
    basePrice: 3500,
    category: 'Water Filtration'
  },
  {
    id: 'water-softener',
    name: 'Water Softener System',
    description: 'Ion exchange water softener system with salt tank and professional installation',
    basePrice: 4500,
    category: 'Water Filtration'
  },
  {
    id: 'reverse-osmosis',
    name: 'Reverse Osmosis System',
    description: 'Reverse osmosis water filtration system with professional installation',
    basePrice: 3000,
    category: 'Water Filtration'
  },
  
  // Air Filtration
  {
    id: 'electronic-air-cleaner',
    name: 'Electronic Air Cleaner (EAC)',
    description: 'Electronic air cleaner with washable filters for superior air quality',
    basePrice: 3000,
    category: 'Air Filtration'
  },
  {
    id: 'hepa-filter',
    name: 'HEPA Filter System',
    description: 'High-efficiency particulate air filtration system for whole house air purification',
    basePrice: 3500,
    category: 'Air Filtration'
  },
  {
    id: 'hrv-system',
    name: 'HRV (Heat Recovery Ventilator)',
    description: 'Heat recovery ventilator for balanced ventilation and energy efficiency',
    basePrice: 6000,
    category: 'Air Filtration'
  },
  
  // Electrical
  {
    id: 'electric-panel-upgrade',
    name: 'Electric Panel Upgrade',
    description: 'Electrical panel upgrade for increased capacity and safety',
    basePrice: 3500,
    category: 'Electrical'
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
