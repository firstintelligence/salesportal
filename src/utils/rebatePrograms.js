// Ontario-wide rebate programs available to all residents
export const PROVINCIAL_PROGRAMS = [
  {
    id: 'hrsp',
    name: 'Home Renovation Savings Program',
    maxRebate: 10000,
    description: 'Provincial rebates for energy-efficient home upgrades'
  },
  {
    id: 'nzf',
    name: 'Net-Zero Fund',
    maxRebate: 5000,
    description: 'Support for net-zero home renovations'
  },
  {
    id: 'enbridge-hec',
    name: 'Enbridge Home Efficiency Rebate',
    maxRebate: 5000,
    description: 'Natural gas efficiency upgrades'
  },
  {
    id: 'greener-homes',
    name: 'Canada Greener Homes Grant',
    maxRebate: 5000,
    description: 'Federal program for home retrofits'
  }
];

// City-specific rebate programs
export const CITY_PROGRAMS = {
  'Toronto': [
    {
      id: 'toronto-home-energy',
      name: 'Toronto Home Energy Loan Program (HELP)',
      maxRebate: 75000,
      description: 'Low-interest loans for energy improvements'
    },
    {
      id: 'toronto-deep-retrofit',
      name: 'Toronto Deep Retrofit Challenge',
      maxRebate: 25000,
      description: 'Incentives for deep energy retrofits'
    }
  ],
  'Hamilton': [
    {
      id: 'hamilton-better-homes',
      name: 'Hamilton Better Homes Program',
      maxRebate: 5000,
      description: 'Energy efficiency rebates for Hamilton residents'
    },
    {
      id: 'hamilton-retrofit',
      name: 'Hamilton Home Retrofit Incentive',
      maxRebate: 3500,
      description: 'Insulation and HVAC upgrades'
    }
  ],
  'Windsor': [
    {
      id: 'windsor-green-standard',
      name: 'Windsor Green Standard Rebate',
      maxRebate: 4000,
      description: 'Rebates for meeting green building standards'
    },
    {
      id: 'windsor-energy-saver',
      name: 'Windsor Energy Saver Program',
      maxRebate: 3000,
      description: 'Energy efficiency improvements'
    }
  ],
  'Ottawa': [
    {
      id: 'ottawa-better-homes',
      name: 'Better Homes Ottawa',
      maxRebate: 10000,
      description: 'Comprehensive home energy retrofit program'
    },
    {
      id: 'ottawa-solar-incentive',
      name: 'Ottawa Solar Incentive',
      maxRebate: 5000,
      description: 'Solar panel installation rebates'
    }
  ],
  'Mississauga': [
    {
      id: 'peel-home-retrofit',
      name: 'Peel Region Home Retrofit Program',
      maxRebate: 4500,
      description: 'Energy efficiency upgrades for Peel residents'
    }
  ],
  'Brampton': [
    {
      id: 'peel-home-retrofit',
      name: 'Peel Region Home Retrofit Program',
      maxRebate: 4500,
      description: 'Energy efficiency upgrades for Peel residents'
    }
  ],
  'London': [
    {
      id: 'london-green-fund',
      name: 'London Green Municipal Fund',
      maxRebate: 5000,
      description: 'Green home improvement rebates'
    }
  ],
  'Kitchener': [
    {
      id: 'waterloo-region-green',
      name: 'Waterloo Region Green Homes',
      maxRebate: 4000,
      description: 'Regional energy efficiency program'
    }
  ],
  'Waterloo': [
    {
      id: 'waterloo-region-green',
      name: 'Waterloo Region Green Homes',
      maxRebate: 4000,
      description: 'Regional energy efficiency program'
    }
  ],
  'Cambridge': [
    {
      id: 'waterloo-region-green',
      name: 'Waterloo Region Green Homes',
      maxRebate: 4000,
      description: 'Regional energy efficiency program'
    }
  ]
};

// Get all eligible programs for a city
export const getEligiblePrograms = (city) => {
  const normalizedCity = city?.trim() || '';
  
  // Find matching city programs (case-insensitive partial match)
  let cityPrograms = [];
  for (const [cityName, programs] of Object.entries(CITY_PROGRAMS)) {
    if (normalizedCity.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(normalizedCity.toLowerCase())) {
      cityPrograms = programs;
      break;
    }
  }
  
  return {
    provincialPrograms: PROVINCIAL_PROGRAMS,
    cityPrograms,
    totalMaxRebate: calculateTotalMaxRebate(PROVINCIAL_PROGRAMS, cityPrograms)
  };
};

// Calculate total maximum rebate amount
const calculateTotalMaxRebate = (provincial, city) => {
  const provincialTotal = provincial.reduce((sum, p) => sum + p.maxRebate, 0);
  const cityTotal = city.reduce((sum, p) => sum + p.maxRebate, 0);
  return provincialTotal + cityTotal;
};
