// Canadian postal code generator utility
export const generatePostalCode = (city, province) => {
  if (!city || !province) return '';

  // Province-specific postal code prefixes
  const provincePrefix = {
    'AB': ['T', 'T'], // Alberta
    'BC': ['V', 'V'], // British Columbia  
    'MB': ['R', 'R'], // Manitoba
    'NB': ['E', 'E'], // New Brunswick
    'NL': ['A', 'A'], // Newfoundland and Labrador
    'NS': ['B', 'B'], // Nova Scotia
    'NT': ['X', 'X'], // Northwest Territories
    'NU': ['X', 'X'], // Nunavut
    'ON': ['K', 'L', 'M', 'N', 'P'], // Ontario
    'PE': ['C', 'C'], // Prince Edward Island
    'QC': ['G', 'H', 'J'], // Quebec
    'SK': ['S', 'S'], // Saskatchewan
    'YT': ['Y', 'Y'] // Yukon
  };

  // City-specific adjustments for major cities
  const cityAdjustments = {
    'toronto': 'M',
    'mississauga': 'L',
    'brampton': 'L', 
    'hamilton': 'L',
    'london': 'N',
    'markham': 'L',
    'vaughan': 'L',
    'kitchener': 'N',
    'windsor': 'N',
    'richmond hill': 'L',
    'burlington': 'L',
    'oakville': 'L',
    'oshawa': 'L',
    'montreal': 'H',
    'quebec': 'G',
    'laval': 'H',
    'gatineau': 'J',
    'longueuil': 'J',
    'sherbrooke': 'J',
    'calgary': 'T',
    'edmonton': 'T',
    'red deer': 'T',
    'lethbridge': 'T',
    'vancouver': 'V',
    'surrey': 'V',
    'burnaby': 'V',
    'richmond': 'V',
    'abbotsford': 'V',
    'coquitlam': 'V',
    'winnipeg': 'R',
    'brandon': 'R',
    'halifax': 'B',
    'moncton': 'E',
    'fredericton': 'E',
    'saint john': 'E',
    'saskatoon': 'S',
    'regina': 'S',
    'prince albert': 'S'
  };

  const prefixes = provincePrefix[province] || ['A'];
  
  // Check if city has specific prefix
  const cityKey = city.toLowerCase().trim();
  let firstLetter;
  
  if (cityAdjustments[cityKey]) {
    firstLetter = cityAdjustments[cityKey];
  } else {
    // Use random prefix from province
    firstLetter = prefixes[Math.floor(Math.random() * prefixes.length)];
  }
  
  // Generate rest of postal code (X#X #X#)
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  const secondChar = numbers[Math.floor(Math.random() * numbers.length)];
  const thirdChar = letters[Math.floor(Math.random() * letters.length)];
  const fourthChar = numbers[Math.floor(Math.random() * numbers.length)];
  const fifthChar = letters[Math.floor(Math.random() * letters.length)];
  const sixthChar = numbers[Math.floor(Math.random() * numbers.length)];
  
  return `${firstLetter}${secondChar}${thirdChar} ${fourthChar}${fifthChar}${sixthChar}`;
};