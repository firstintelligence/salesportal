// 3-tier pricing: cost (what we pay), min (minimum sell price), max (listed/retail price which is basePrice)
// basePrice from hvacProducts.js is the "max" (retail) price

import heatPumpsImg from '@/assets/categories/heat-pumps.jpg';
import ductlessImg from '@/assets/categories/ductless-heat-pumps.jpg';
import furnacesImg from '@/assets/categories/furnaces.jpg';
import boilersImg from '@/assets/categories/boilers.jpg';
import acImg from '@/assets/categories/air-conditioning.jpg';
import waterHeatingImg from '@/assets/categories/water-heating.jpg';
import energyEffImg from '@/assets/categories/energy-efficiency.jpg';
import energyStorageImg from '@/assets/categories/energy-storage.jpg';
import waterFiltImg from '@/assets/categories/water-filtration.jpg';
import airFiltImg from '@/assets/categories/air-filtration.jpg';
import electricalImg from '@/assets/categories/electrical.jpg';
import servicesImg from '@/assets/categories/services.jpg';

export const categoryImages = {
  'Heat Pumps': heatPumpsImg,
  'Ductless Heat Pumps': ductlessImg,
  'Furnaces': furnacesImg,
  'Boilers': boilersImg,
  'Air Conditioning': acImg,
  'Water Heating': waterHeatingImg,
  'Energy Efficiency': energyEffImg,
  'Energy Storage': energyStorageImg,
  'Water Filtration': waterFiltImg,
  'Air Filtration': airFiltImg,
  'Electrical': electricalImg,
  'Services': servicesImg,
};

export const categoryColors = {
  'Heat Pumps': { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' },
  'Ductless Heat Pumps': { gradient: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  'Furnaces': { gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-700' },
  'Boilers': { gradient: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-700' },
  'Air Conditioning': { gradient: 'from-sky-500 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-700' },
  'Water Heating': { gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700' },
  'Energy Efficiency': { gradient: 'from-green-500 to-green-600', bg: 'bg-green-50', text: 'text-green-700' },
  'Energy Storage': { gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700' },
  'Water Filtration': { gradient: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-700' },
  'Air Filtration': { gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  'Electrical': { gradient: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'Services': { gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-100', text: 'text-slate-700' },
};

// Product pricing: cost, min, max for each product by ID
export const productPricing = {
  // Heat Pumps
  'heat-pump-2-ton':        { cost: 6500, min: 14000, max: 18000 },
  'heat-pump-3-ton':        { cost: 7500, min: 16000, max: 20000 },
  'heat-pump-4-ton':        { cost: 8500, min: 18000, max: 22000 },
  'air-handler':            { cost: 1800, min: 3500, max: 4500 },

  // Ductless Heat Pumps
  'ductless-heat-pump-1-head': { cost: 3500, min: 9000, max: 12000 },
  'ductless-heat-pump-2-head': { cost: 5500, min: 12000, max: 16000 },
  'ductless-heat-pump-3-head': { cost: 8000, min: 17000, max: 22000 },

  // Furnaces
  'furnace-gas-45k':        { cost: 1800, min: 3500, max: 4500 },
  'furnace-gas-70k':        { cost: 2800, min: 5500, max: 7000 },
  'furnace-gas-90k':        { cost: 3500, min: 7000, max: 9000 },
  'furnace-gas-110k':       { cost: 4500, min: 8500, max: 11000 },

  // Boilers
  'boiler-system':          { cost: 4500, min: 9000, max: 12000 },
  'combi-boiler':           { cost: 6000, min: 12000, max: 16000 },

  // Air Conditioning
  'ac-central-14-seer':     { cost: 1500, min: 3000, max: 4000 },
  'ac-central-16-seer':     { cost: 2200, min: 4500, max: 6000 },

  // Water Heating - Tankless
  'tankless-1-2-bath':      { cost: 2200, min: 4500, max: 5800 },
  'tankless-2-3-bath':      { cost: 2500, min: 5000, max: 6500 },
  'tankless-3-4-bath':      { cost: 2800, min: 5500, max: 7200 },
  'tankless-4-plus-bath':   { cost: 3200, min: 6500, max: 8200 },

  // Water Heating - Conventional
  'cv40':                   { cost: 1200, min: 3000, max: 4000 },
  'cv50':                   { cost: 1500, min: 3800, max: 5000 },
  'cv60':                   { cost: 1800, min: 4500, max: 6000 },

  // Water Heating - Power Vent
  'pv40':                   { cost: 1500, min: 3500, max: 4500 },
  'pv50':                   { cost: 1800, min: 4200, max: 5500 },
  'pv60':                   { cost: 2100, min: 5000, max: 6500 },

  // Water Heating - Electric
  'hot-water-tank-40-electric': { cost: 1000, min: 3000, max: 4000 },
  'hot-water-tank-50-electric': { cost: 1200, min: 3800, max: 5000 },
  'hot-water-tank-60-electric': { cost: 1500, min: 4500, max: 6000 },

  // Hybrid
  'hybrid-water-heater':    { cost: 2500, min: 5000, max: 6500 },

  // Energy Efficiency
  'attic-insulation-1000':      { cost: 1500, min: 3500, max: 4500 },
  'attic-insulation-1000-plus': { cost: 2200, min: 5000, max: 6500 },
  'air-sealing-draft-proofing': { cost: 1800, min: 3800, max: 5000 },

  // Energy Storage
  'smart-home-battery-10-12kw': { cost: 18000, min: 28000, max: 34000 },
  'smart-home-battery-15-16kw': { cost: 20000, min: 30000, max: 36000 },
  'smart-home-battery-20kw':    { cost: 22000, min: 32000, max: 38000 },
  'solar-panels':               { cost: 12000, min: 20000, max: 25000 },

  // Water Filtration
  'carbon-filter':          { cost: 800, min: 2500, max: 3500 },
  'water-softener':         { cost: 1200, min: 3500, max: 4500 },
  'reverse-osmosis':        { cost: 600, min: 2000, max: 3000 },
  'uv-water-filter':        { cost: 500, min: 1800, max: 2500 },

  // Air Filtration
  'electronic-air-cleaner': { cost: 800, min: 2200, max: 3000 },
  'hepa-filter':            { cost: 1000, min: 2500, max: 3500 },
  'hrv-system':             { cost: 2200, min: 4500, max: 6000 },
  'uv-air-filter':          { cost: 400, min: 1000, max: 1500 },
  'air-purifier':           { cost: 600, min: 1800, max: 2500 },

  // Electrical
  'electric-panel-upgrade': { cost: 1200, min: 2500, max: 3500 },

  // Services
  'duct-cleaning':          { cost: 150, min: 350, max: 500 },
  'maintenance-plan':       { cost: 100, min: 200, max: 300 },
  'plumbing-repairs':       { cost: 150, min: 350, max: 500 },
  'electrical-work':        { cost: 150, min: 350, max: 500 },
  'sheet-metal':            { cost: 300, min: 700, max: 1000 },
};

export const getPricingForProduct = (productId) => {
  return productPricing[productId] || null;
};
