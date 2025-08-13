export const getProductDescription = (productId) => {
  const descriptions = {
    'heat-pump-residential': 'Premium residential heat pump system featuring advanced inverter technology, whisper-quiet operation, and exceptional energy efficiency. Includes professional installation, 10-year manufacturer warranty, and comprehensive system commissioning.',
    'heat-pump-commercial': 'Commercial-grade heat pump engineered for demanding applications. Features robust construction, advanced controls, and superior performance in extreme weather conditions. Includes complete installation package and extended warranty coverage.',
    'furnace-gas-80': 'Reliable 80% AFUE natural gas furnace with proven technology and dependable performance. Features durable heat exchanger, multi-speed blower, and comprehensive installation including new gas line connections where required.',
    'furnace-gas-95': 'High-efficiency 95% AFUE condensing gas furnace with modulating burner technology. Delivers exceptional comfort and energy savings with advanced control systems and premium components. Complete installation package included.',
    'ac-central-14-seer': 'Energy-efficient 14 SEER central air conditioning system with scroll compressor technology. Features environmentally-friendly refrigerant, corrosion-resistant coils, and professional installation with electrical connections.',
    'ac-central-16-seer': 'Premium 16 SEER high-efficiency central air conditioning with variable-speed technology. Delivers superior comfort, humidity control, and energy savings. Includes professional installation and system optimization.',
    'tankless-gas': 'On-demand natural gas tankless water heater providing endless hot water supply. Features compact design, precise temperature control, and energy-efficient operation. Installation includes gas line upgrades and venting systems.',
    'tankless-electric': 'Electric tankless water heater with instant hot water delivery and space-saving design. Features digital temperature control and energy-efficient heating elements. Professional installation with electrical upgrades included.',
    'hot-water-tank-40': '40-gallon conventional hot water tank with reliable performance and efficient operation. Features glass-lined tank, anode rod protection, and comprehensive installation with new connections.',
    'hot-water-tank-60': '60-gallon high-capacity hot water tank ideal for larger households. Features enhanced insulation, corrosion-resistant design, and professional installation with plumbing upgrades.',
    'ductwork-installation': 'Complete ductwork system installation using premium materials and professional design. Includes properly sized supply and return ducts, sealed connections, and optimized airflow distribution.',
    'hvac-maintenance': 'Comprehensive annual HVAC maintenance package including system inspection, cleaning, calibration, and performance optimization. Includes priority service scheduling and extended warranty protection.',
    'thermostat-programmable': 'Digital programmable thermostat with 7-day scheduling and energy-saving features. Professional installation includes wiring upgrades and system configuration for optimal performance.',
    'thermostat-smart': 'Advanced Wi-Fi smart thermostat with smartphone app control, learning algorithms, and energy reports. Features geofencing, voice control compatibility, and professional installation with system integration.',
    'home-energy-assessment': 'Comprehensive home energy audit conducted by certified professionals. Includes blower door test, thermal imaging, insulation assessment, and detailed efficiency recommendations with rebate guidance.'
  };
  
  return descriptions[productId] || '';
};