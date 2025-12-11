import polaronLogo from '@/assets/polaron-logo.png';
import georgesLogo from '/lovable-uploads/62b81d29-a2f1-4fb2-85a9-c836aa3c2bb1.png';

// Tenant logo mappings
export const getTenantLogo = (tenantSlug) => {
  const logos = {
    'georges-plumbing': georgesLogo,
    'polaron-comfort': polaronLogo,
    'polaron': polaronLogo,
    'maher-heating': null,
    'crown-construction': null,
    'marathon-electric': null,
  };
  
  return logos[tenantSlug] || null;
};

// Default logo for login page (shows all available tenant logos)
export const getDefaultLogos = () => ({
  georges: georgesLogo,
  polaron: polaronLogo,
});

// Tenant company info
export const getTenantCompanyInfo = (tenantSlug) => {
  const companies = {
    'georges-plumbing': {
      name: "George's Plumbing and Heating",
      address: "14 Rathmine Street, London, ON N5Z 1Z3",
      phone: "(519) 851-2704",
      email: "info@georgesplumbingandheating.ca",
      invoicePrefix: "GPH"
    },
    'polaron-comfort': {
      name: "Polaron Comfort",
      address: "2 Tippett Rd Floor 4, North York, ON M3H 2V2",
      phone: "+1 888-318-1988",
      email: "info@polaronsolar.com",
      invoicePrefix: "PC"
    },
    'polaron': {
      name: "Polaron Comfort",
      address: "2 Tippett Rd Floor 4, North York, ON M3H 2V2",
      phone: "+1 888-318-1988",
      email: "info@polaronsolar.com",
      invoicePrefix: "PC"
    },
    'maher-heating': {
      name: "Maher Heating & Cooling",
      address: "",
      phone: "",
      email: "",
      invoicePrefix: "MHC"
    },
    'crown-construction': {
      name: "Crown Construction",
      address: "",
      phone: "",
      email: "",
      invoicePrefix: "CC"
    },
    'marathon-electric': {
      name: "Marathon Electric",
      address: "1200 Bay Street, Toronto, ON M5W 2A9",
      phone: "+1 (647) 794-1199",
      email: "info@marathon-electric.ca",
      invoicePrefix: "ME"
    },
  };
  
  return companies[tenantSlug] || companies['georges-plumbing'];
};

// Tenant color schemes
export const getTenantColors = (tenantSlug) => {
  const colors = {
    'georges-plumbing': {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(224, 76%, 48%)',
    },
    'polaron-comfort': {
      primary: 'hsl(145, 63%, 42%)',
      secondary: 'hsl(145, 63%, 32%)',
    },
    'polaron': {
      primary: 'hsl(145, 63%, 42%)',
      secondary: 'hsl(145, 63%, 32%)',
    },
    'maher-heating': {
      primary: 'hsl(0, 84%, 60%)',
      secondary: 'hsl(0, 84%, 50%)',
    },
    'crown-construction': {
      primary: 'hsl(45, 93%, 47%)',
      secondary: 'hsl(45, 93%, 37%)',
    },
    'marathon-electric': {
      primary: 'hsl(280, 68%, 50%)',
      secondary: 'hsl(280, 68%, 40%)',
    },
  };
  
  return colors[tenantSlug] || colors['georges-plumbing'];
};
