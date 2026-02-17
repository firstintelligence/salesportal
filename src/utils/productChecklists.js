// Product-specific checklist configurations
// Each product type has: photos (required images) and questions (questionnaire items)

export const PRODUCT_CHECKLISTS = {
  "Water Heater": {
    photos: [
      "Existing Water Heater / Tank",
      "Venting",
      "Water Connections",
      "Gas/Electric Connection",
      "Installation Area",
    ],
    questions: [
      { id: "tank_size", label: "What size is the current tank?", type: "select", options: ["40 Gallon", "50 Gallon", "60 Gallon", "75 Gallon", "Other"] },
      { id: "fuel_type", label: "Fuel type?", type: "select", options: ["Natural Gas", "Electric", "Propane", "Oil"] },
      { id: "location", label: "Where is the water heater located?", type: "select", options: ["Basement", "Utility Room", "Garage", "Closet", "Other"] },
      { id: "venting_type", label: "Current venting type?", type: "select", options: ["Power Vent", "Direct Vent", "Atmospheric", "Not Sure"] },
      { id: "notes", label: "Additional notes", type: "text" },
    ],
  },
  "Tankless Water Heater": {
    photos: [
      "Existing Water Heater / Tank",
      "Venting",
      "Water Connections",
      "Gas/Electric Connection",
      "Installation Area",
    ],
    questions: [
      { id: "tank_size", label: "Current tank size (if replacing)?", type: "select", options: ["40 Gallon", "50 Gallon", "60 Gallon", "No Existing Tank", "Other"] },
      { id: "fuel_type", label: "Fuel type?", type: "select", options: ["Natural Gas", "Electric", "Propane"] },
      { id: "location", label: "Proposed tankless location?", type: "select", options: ["Basement", "Utility Room", "Garage", "Wall-Mounted", "Other"] },
      { id: "gas_line_size", label: "Gas line size (if applicable)?", type: "select", options: ["1/2 inch", "3/4 inch", "1 inch", "Not Sure"] },
      { id: "notes", label: "Additional notes", type: "text" },
    ],
  },
  "Heat Pump": {
    photos: [
      "Outdoor Unit (or where it will go)",
      "Electric Panel",
      "Existing Furnace",
      "Coil / Air Handler",
      "Thermostat",
      "Ductwork",
    ],
    questions: [
      { id: "existing_ac", label: "Is there an existing AC unit?", type: "select", options: ["Yes", "No"] },
      { id: "ac_tonnage", label: "Tonnage (if known)?", type: "select", options: ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "3.5 Ton", "4 Ton", "5 Ton", "Not Sure"] },
      { id: "electrical_capacity", label: "Main panel amperage?", type: "select", options: ["100A", "125A", "150A", "200A", "Not Sure"] },
      { id: "ductwork_condition", label: "Ductwork condition?", type: "select", options: ["Good", "Fair", "Poor", "No Ductwork"] },
      { id: "notes", label: "Additional notes", type: "text" },
    ],
  },
  "Air Conditioner": {
    photos: [
      "Existing AC Unit (outdoor)",
      "Electric Panel",
      "Coil / Air Handler",
      "Thermostat",
      "Ductwork",
    ],
    questions: [
      { id: "existing_ac", label: "Is there an existing AC?", type: "select", options: ["Yes - Replacing", "No - New Install"] },
      { id: "ac_tonnage", label: "Tonnage (if known)?", type: "select", options: ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "3.5 Ton", "4 Ton", "5 Ton", "Not Sure"] },
      { id: "pad_location", label: "Outdoor pad location?", type: "select", options: ["Side of House", "Backyard", "Front", "Rooftop", "Other"] },
      { id: "notes", label: "Additional notes", type: "text" },
    ],
  },
  "Furnace": {
    photos: [
      "Existing Furnace",
      "Venting",
      "Thermostat",
      "Ductwork",
      "Gas Line / Shutoff",
      "Electric Panel",
    ],
    questions: [
      { id: "fuel_type", label: "Fuel type?", type: "select", options: ["Natural Gas", "Propane", "Oil", "Electric"] },
      { id: "furnace_age", label: "Approximate age of current furnace?", type: "select", options: ["< 5 years", "5-10 years", "10-15 years", "15-20 years", "20+ years", "Unknown"] },
      { id: "furnace_size", label: "BTU rating (if known)?", type: "select", options: ["40,000", "60,000", "80,000", "100,000", "120,000", "Not Sure"] },
      { id: "venting_type", label: "Current venting type?", type: "select", options: ["High Efficiency (PVC)", "Mid Efficiency (Metal)", "Not Sure"] },
      { id: "notes", label: "Additional notes", type: "text" },
    ],
  },
  "Insulation": {
    photos: [
      "Attic Space",
      "Current Insulation",
      "Attic Access Point",
      "Roof / Rafters",
    ],
    questions: [
      { id: "attic_access", label: "Attic access type?", type: "select", options: ["Pull-Down Stairs", "Hatch", "Walk-Up", "No Access"] },
      { id: "current_insulation", label: "Current insulation type?", type: "select", options: ["Blown-In", "Batt", "Spray Foam", "None", "Not Sure"] },
      { id: "current_r_value", label: "Current R-value (if known)?", type: "select", options: ["R-10 or less", "R-20", "R-30", "R-40+", "Not Sure"] },
      { id: "sq_footage", label: "Approximate attic sq footage?", type: "text" },
      { id: "obstructions", label: "Any obstructions in attic?", type: "select", options: ["None", "HVAC Ducts", "Electrical", "Storage", "Multiple"] },
      { id: "notes", label: "Additional notes", type: "text" },
    ],
  },
  "Battery": {
    photos: [
      "Electric Panel",
      "Proposed Install Location",
      "Existing Solar Setup (if any)",
      "Meter / Disconnect",
    ],
    questions: [
      { id: "panel_capacity", label: "Main panel amperage?", type: "select", options: ["100A", "125A", "150A", "200A", "Not Sure"] },
      { id: "existing_solar", label: "Is there existing solar?", type: "select", options: ["Yes", "No"] },
      { id: "backup_needs", label: "What needs backup power?", type: "select", options: ["Whole Home", "Essential Loads Only", "Not Sure"] },
      { id: "install_location", label: "Preferred install location?", type: "select", options: ["Garage", "Basement", "Utility Room", "Exterior Wall", "Other"] },
      { id: "notes", label: "Additional notes", type: "text" },
    ],
  },
};

// Base categories that always appear
export const BASE_PHOTO_CATEGORIES = {
  "Void Cheque": {
    items: ["Void Cheque"],
    optional: true,
  },
  "Photo ID": {
    items: ["Photo ID"],
    optional: false,
  },
};

// Match a product string to a checklist key
export const matchProductToChecklist = (productString) => {
  if (!productString) return null;
  const lower = productString.toLowerCase();
  
  if (lower.includes("tankless")) return "Tankless Water Heater";
  if (lower.includes("water heater") || lower.includes("hot water")) return "Water Heater";
  if (lower.includes("heat pump")) return "Heat Pump";
  if (lower.includes("air conditioner") || lower.includes(" ac")) return "Air Conditioner";
  if (lower.includes("furnace")) return "Furnace";
  if (lower.includes("insulation") || lower.includes("attic")) return "Insulation";
  if (lower.includes("battery") || lower.includes("powerwall") || lower.includes("energy storage")) return "Battery";
  
  return null;
};

// Get all applicable checklists for a products string (comma-separated)
export const getChecklistsForProducts = (productsString) => {
  if (!productsString) return {};
  
  const products = productsString.split(",").map(p => p.trim());
  const matched = {};
  
  products.forEach(product => {
    const key = matchProductToChecklist(product);
    if (key && PRODUCT_CHECKLISTS[key] && !matched[key]) {
      matched[key] = PRODUCT_CHECKLISTS[key];
    }
  });
  
  return matched;
};
