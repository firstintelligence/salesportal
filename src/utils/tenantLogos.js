import polaronLogo from '@/assets/polaron-logo-transparent.png';
import edisonEnergyLogo from '@/assets/edison-energy-logo.svg';
import energyExpertsLogo from '@/assets/energy-experts-logo.svg';
import renoProsLogo from '@/assets/reno-pros-logo.svg';
import provincialEnergyGroupLogo from '@/assets/provincial-energy-group-logo.svg';

const georgesLogo = '/lovable-uploads/62b81d29-a2f1-4fb2-85a9-c836aa3c2bb1.png';

// Tenant logo mappings
export const getTenantLogo = (tenantSlug) => {
  const logos = {
    'georges': georgesLogo,
    'polaron': polaronLogo,
    'maher': null,
    'crown': null,
    'marathon': null,
    'edison': edisonEnergyLogo,
    'energyexperts': energyExpertsLogo,
    'renopros': renoProsLogo,
    'provincial': provincialEnergyGroupLogo,
  };
  
  return logos[tenantSlug] || null;
};

// Default logo for login page (shows all available tenant logos)
export const getDefaultLogos = () => ({
  georges: georgesLogo,
  polaron: polaronLogo,
  edison: edisonEnergyLogo,
  energyexperts: energyExpertsLogo,
  renopros: renoProsLogo,
  provincial: provincialEnergyGroupLogo,
});

// Tenant company info
export const getTenantCompanyInfo = (tenantSlug) => {
  const companies = {
    'georges': {
      name: "George's Plumbing and Heating",
      address: "14 Rathmine Street, London, ON N5Z 1Z3",
      phone: "(519) 851-2704",
      email: "info@georgesplumbingandheating.ca",
      invoicePrefix: "GPH"
    },
    'polaron': {
      name: "Polaron Comfort",
      address: "2 Tippett Rd Floor 4, North York, ON M3H 2V2",
      phone: "+1 888-318-1988",
      email: "info@polaronsolar.com",
      invoicePrefix: "PLRN"
    },
    'maher': {
      name: "Maher Heating & Cooling",
      address: "",
      phone: "",
      email: "",
      invoicePrefix: "MHC"
    },
    'crown': {
      name: "Crown Construction",
      address: "",
      phone: "",
      email: "",
      invoicePrefix: "CC"
    },
    'marathon': {
      name: "Marathon Electric",
      address: "1200 Bay Street, Toronto, ON M5W 2A9",
      phone: "+1 (647) 794-1199",
      email: "info@marathon-electric.ca",
      invoicePrefix: "MARA"
    },
    'edison': {
      name: "Edison Energy",
      address: "100 King Street West, Toronto, ON M5X 1A9",
      phone: "",
      email: "info@edisonenergy.ca",
      invoicePrefix: "EDSN"
    },
    'energyexperts': {
      name: "Energy Experts",
      address: "100 King Street West, Toronto, ON M5X 1A9",
      phone: "",
      email: "info@energyexperts.io",
      invoicePrefix: "ENEX"
    },
    'renopros': {
      name: "Reno Pros",
      address: "100 King Street West, Toronto, ON M5X 1A9",
      phone: "",
      email: "info@renopros.io",
      invoicePrefix: "RENO"
    },
    'provincial': {
      name: "Provincial Energy Group",
      address: "100 King Street West, Toronto, ON M5X 1A9",
      phone: "",
      email: "info@provincialenergygroup.com",
      invoicePrefix: "PROV"
    },
  };
  
  return companies[tenantSlug] || companies['georges'];
};

// Tenant color schemes
export const getTenantColors = (tenantSlug) => {
  const colors = {
    'georges': {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(224, 76%, 48%)',
    },
    'polaron': {
      primary: 'hsl(145, 63%, 42%)',
      secondary: 'hsl(145, 63%, 32%)',
    },
    'maher': {
      primary: 'hsl(0, 84%, 60%)',
      secondary: 'hsl(0, 84%, 50%)',
    },
    'crown': {
      primary: 'hsl(45, 93%, 47%)',
      secondary: 'hsl(45, 93%, 37%)',
    },
    'marathon': {
      primary: 'hsl(280, 68%, 50%)',
      secondary: 'hsl(280, 68%, 40%)',
    },
    'edison': {
      primary: 'hsl(27, 91%, 54%)',
      secondary: 'hsl(27, 91%, 44%)',
    },
    'energyexperts': {
      primary: 'hsl(217, 91%, 67%)',
      secondary: 'hsl(217, 91%, 57%)',
    },
    'renopros': {
      primary: 'hsl(195, 100%, 47%)',
      secondary: 'hsl(195, 100%, 37%)',
    },
    'provincial': {
      primary: 'hsl(199, 98%, 37%)',
      secondary: 'hsl(199, 98%, 27%)',
    },
  };
  
  return colors[tenantSlug] || colors['georges'];
};
