import polaronLogo from '@/assets/polaron-logo.webp';

// Tenant logo mappings
export const getTenantLogo = (tenantSlug) => {
  const logos = {
    'georges-plumbing': '/lovable-uploads/62b81d29-a2f1-4fb2-85a9-c836aa3c2bb1.png',
    'polaron-comfort': polaronLogo,
    'maher-heating': null, // Placeholder - no logo yet
    'crown-construction': null, // Placeholder - no logo yet
    'marathon-electric': null, // Placeholder - no logo yet
  };
  
  return logos[tenantSlug] || null;
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
