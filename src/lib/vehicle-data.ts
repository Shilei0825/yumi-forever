// ---------------------------------------------------------------------------
// Vehicle Make/Model → Vehicle Class Auto-Detection
// ---------------------------------------------------------------------------

import type { VehicleClass } from './pricing-engine'

interface VehicleModelInfo {
  class: VehicleClass
  years?: string // optional note
}

// ---------------------------------------------------------------------------
// Comprehensive make → model → class mapping
// ---------------------------------------------------------------------------

const VEHICLE_DATABASE: Record<string, Record<string, VehicleModelInfo>> = {
  // --- ACURA ---
  Acura: {
    ILX: { class: 'sedan' },
    TLX: { class: 'sedan' },
    Integra: { class: 'sedan' },
    RDX: { class: 'small_suv' },
    MDX: { class: 'large_suv' },
    ZDX: { class: 'large_suv' },
  },

  // --- ALFA ROMEO ---
  'Alfa Romeo': {
    Giulia: { class: 'sedan' },
    Stelvio: { class: 'small_suv' },
    Tonale: { class: 'small_suv' },
  },

  // --- AUDI ---
  Audi: {
    A3: { class: 'sedan' },
    A4: { class: 'sedan' },
    A5: { class: 'sedan' },
    A6: { class: 'sedan' },
    A7: { class: 'sedan' },
    A8: { class: 'sedan' },
    S3: { class: 'sedan' },
    S4: { class: 'sedan' },
    S5: { class: 'sedan' },
    S6: { class: 'sedan' },
    RS3: { class: 'sedan' },
    RS5: { class: 'sedan' },
    RS6: { class: 'sedan' },
    RS7: { class: 'sedan' },
    TT: { class: 'sedan' },
    R8: { class: 'sedan' },
    'e-tron GT': { class: 'sedan' },
    Q3: { class: 'small_suv' },
    Q4: { class: 'small_suv' },
    Q5: { class: 'small_suv' },
    Q7: { class: 'large_suv' },
    Q8: { class: 'large_suv' },
    'e-tron': { class: 'large_suv' },
  },

  // --- BMW ---
  BMW: {
    '2 Series': { class: 'sedan' },
    '3 Series': { class: 'sedan' },
    '4 Series': { class: 'sedan' },
    '5 Series': { class: 'sedan' },
    '7 Series': { class: 'sedan' },
    '8 Series': { class: 'sedan' },
    i4: { class: 'sedan' },
    i5: { class: 'sedan' },
    i7: { class: 'sedan' },
    M2: { class: 'sedan' },
    M3: { class: 'sedan' },
    M4: { class: 'sedan' },
    M5: { class: 'sedan' },
    M8: { class: 'sedan' },
    Z4: { class: 'sedan' },
    X1: { class: 'small_suv' },
    X2: { class: 'small_suv' },
    X3: { class: 'small_suv' },
    X4: { class: 'small_suv' },
    iX1: { class: 'small_suv' },
    iX3: { class: 'small_suv' },
    X5: { class: 'large_suv' },
    X6: { class: 'large_suv' },
    X7: { class: 'large_suv' },
    XM: { class: 'large_suv' },
    iX: { class: 'large_suv' },
  },

  // --- BUICK ---
  Buick: {
    Envista: { class: 'small_suv' },
    Encore: { class: 'small_suv' },
    'Encore GX': { class: 'small_suv' },
    Envision: { class: 'small_suv' },
    Enclave: { class: 'large_suv' },
  },

  // --- CADILLAC ---
  Cadillac: {
    CT4: { class: 'sedan' },
    CT5: { class: 'sedan' },
    XT4: { class: 'small_suv' },
    XT5: { class: 'small_suv' },
    Lyriq: { class: 'small_suv' },
    XT6: { class: 'large_suv' },
    Escalade: { class: 'large_suv' },
    'Escalade ESV': { class: 'large_suv' },
  },

  // --- CHEVROLET ---
  Chevrolet: {
    Malibu: { class: 'sedan' },
    Camaro: { class: 'sedan' },
    Corvette: { class: 'sedan' },
    Bolt: { class: 'sedan' },
    'Bolt EUV': { class: 'small_suv' },
    Trax: { class: 'small_suv' },
    Trailblazer: { class: 'small_suv' },
    Equinox: { class: 'small_suv' },
    Blazer: { class: 'small_suv' },
    Traverse: { class: 'large_suv' },
    Tahoe: { class: 'large_suv' },
    Suburban: { class: 'large_suv' },
    Colorado: { class: 'truck_van' },
    Silverado: { class: 'truck_van' },
    'Silverado HD': { class: 'truck_van' },
    Express: { class: 'truck_van' },
  },

  // --- CHRYSLER ---
  Chrysler: {
    300: { class: 'sedan' },
    Pacifica: { class: 'truck_van' },
    Voyager: { class: 'truck_van' },
  },

  // --- DODGE ---
  Dodge: {
    Charger: { class: 'sedan' },
    Challenger: { class: 'sedan' },
    Hornet: { class: 'small_suv' },
    Durango: { class: 'large_suv' },
    'Grand Caravan': { class: 'truck_van' },
    Ram: { class: 'truck_van' },
  },

  // --- FORD ---
  Ford: {
    Mustang: { class: 'sedan' },
    Fusion: { class: 'sedan' },
    'Mustang Mach-E': { class: 'small_suv' },
    Escape: { class: 'small_suv' },
    Bronco: { class: 'small_suv' },
    'Bronco Sport': { class: 'small_suv' },
    Edge: { class: 'small_suv' },
    Explorer: { class: 'large_suv' },
    Expedition: { class: 'large_suv' },
    'Expedition MAX': { class: 'large_suv' },
    Ranger: { class: 'truck_van' },
    Maverick: { class: 'truck_van' },
    'F-150': { class: 'truck_van' },
    'F-150 Lightning': { class: 'truck_van' },
    'F-250': { class: 'truck_van' },
    'F-350': { class: 'truck_van' },
    Transit: { class: 'truck_van' },
    'Transit Connect': { class: 'truck_van' },
    'E-Transit': { class: 'truck_van' },
  },

  // --- GENESIS ---
  Genesis: {
    G70: { class: 'sedan' },
    G80: { class: 'sedan' },
    G90: { class: 'sedan' },
    GV60: { class: 'small_suv' },
    GV70: { class: 'small_suv' },
    GV80: { class: 'large_suv' },
  },

  // --- GMC ---
  GMC: {
    Terrain: { class: 'small_suv' },
    Acadia: { class: 'large_suv' },
    Yukon: { class: 'large_suv' },
    'Yukon XL': { class: 'large_suv' },
    Canyon: { class: 'truck_van' },
    Sierra: { class: 'truck_van' },
    'Sierra HD': { class: 'truck_van' },
    Hummer: { class: 'truck_van' },
  },

  // --- HONDA ---
  Honda: {
    Civic: { class: 'sedan' },
    Accord: { class: 'sedan' },
    Insight: { class: 'sedan' },
    'HR-V': { class: 'small_suv' },
    'CR-V': { class: 'small_suv' },
    'ZR-V': { class: 'small_suv' },
    Passport: { class: 'large_suv' },
    Pilot: { class: 'large_suv' },
    Prologue: { class: 'large_suv' },
    Ridgeline: { class: 'truck_van' },
    Odyssey: { class: 'truck_van' },
  },

  // --- HYUNDAI ---
  Hyundai: {
    Elantra: { class: 'sedan' },
    Sonata: { class: 'sedan' },
    Ioniq: { class: 'sedan' },
    'Ioniq 5': { class: 'small_suv' },
    'Ioniq 6': { class: 'sedan' },
    Venue: { class: 'small_suv' },
    Kona: { class: 'small_suv' },
    Tucson: { class: 'small_suv' },
    'Santa Fe': { class: 'large_suv' },
    'Santa Cruz': { class: 'truck_van' },
    Palisade: { class: 'large_suv' },
  },

  // --- INFINITI ---
  Infiniti: {
    Q50: { class: 'sedan' },
    Q60: { class: 'sedan' },
    QX50: { class: 'small_suv' },
    QX55: { class: 'small_suv' },
    QX60: { class: 'large_suv' },
    QX80: { class: 'large_suv' },
  },

  // --- JAGUAR ---
  Jaguar: {
    XE: { class: 'sedan' },
    XF: { class: 'sedan' },
    'F-Type': { class: 'sedan' },
    'E-Pace': { class: 'small_suv' },
    'F-Pace': { class: 'large_suv' },
    'I-Pace': { class: 'small_suv' },
  },

  // --- JEEP ---
  Jeep: {
    Renegade: { class: 'small_suv' },
    Compass: { class: 'small_suv' },
    Cherokee: { class: 'small_suv' },
    Wrangler: { class: 'small_suv' },
    'Grand Cherokee': { class: 'large_suv' },
    'Grand Cherokee L': { class: 'large_suv' },
    'Grand Wagoneer': { class: 'large_suv' },
    Wagoneer: { class: 'large_suv' },
    Gladiator: { class: 'truck_van' },
  },

  // --- KIA ---
  Kia: {
    Forte: { class: 'sedan' },
    K5: { class: 'sedan' },
    Stinger: { class: 'sedan' },
    EV6: { class: 'small_suv' },
    EV9: { class: 'large_suv' },
    Niro: { class: 'small_suv' },
    Seltos: { class: 'small_suv' },
    Sportage: { class: 'small_suv' },
    Sorento: { class: 'large_suv' },
    Telluride: { class: 'large_suv' },
    Carnival: { class: 'truck_van' },
    Soul: { class: 'small_suv' },
  },

  // --- LAND ROVER ---
  'Land Rover': {
    'Range Rover Evoque': { class: 'small_suv' },
    'Range Rover Velar': { class: 'large_suv' },
    'Range Rover Sport': { class: 'large_suv' },
    'Range Rover': { class: 'large_suv' },
    Defender: { class: 'large_suv' },
    Discovery: { class: 'large_suv' },
    'Discovery Sport': { class: 'small_suv' },
  },

  // --- LEXUS ---
  Lexus: {
    IS: { class: 'sedan' },
    ES: { class: 'sedan' },
    LS: { class: 'sedan' },
    RC: { class: 'sedan' },
    LC: { class: 'sedan' },
    UX: { class: 'small_suv' },
    NX: { class: 'small_suv' },
    RZ: { class: 'small_suv' },
    RX: { class: 'large_suv' },
    TX: { class: 'large_suv' },
    GX: { class: 'large_suv' },
    LX: { class: 'large_suv' },
  },

  // --- LINCOLN ---
  Lincoln: {
    Corsair: { class: 'small_suv' },
    Nautilus: { class: 'large_suv' },
    Aviator: { class: 'large_suv' },
    Navigator: { class: 'large_suv' },
  },

  // --- MAZDA ---
  Mazda: {
    Mazda3: { class: 'sedan' },
    MX5: { class: 'sedan' },
    'MX-5': { class: 'sedan' },
    'MX-5 Miata': { class: 'sedan' },
    'CX-30': { class: 'small_suv' },
    'CX-5': { class: 'small_suv' },
    'CX-50': { class: 'small_suv' },
    'CX-70': { class: 'large_suv' },
    'CX-90': { class: 'large_suv' },
    'CX-9': { class: 'large_suv' },
  },

  // --- MERCEDES-BENZ ---
  'Mercedes-Benz': {
    'A-Class': { class: 'sedan' },
    'C-Class': { class: 'sedan' },
    CLA: { class: 'sedan' },
    'E-Class': { class: 'sedan' },
    'S-Class': { class: 'sedan' },
    AMG: { class: 'sedan' },
    EQE: { class: 'sedan' },
    EQS: { class: 'sedan' },
    SL: { class: 'sedan' },
    GLA: { class: 'small_suv' },
    GLB: { class: 'small_suv' },
    GLC: { class: 'small_suv' },
    'EQE SUV': { class: 'large_suv' },
    GLE: { class: 'large_suv' },
    GLS: { class: 'large_suv' },
    'EQS SUV': { class: 'large_suv' },
    'G-Class': { class: 'large_suv' },
    Sprinter: { class: 'truck_van' },
    Metris: { class: 'truck_van' },
  },

  // --- MINI ---
  MINI: {
    Cooper: { class: 'sedan' },
    Clubman: { class: 'sedan' },
    Countryman: { class: 'small_suv' },
  },

  // --- MITSUBISHI ---
  Mitsubishi: {
    Mirage: { class: 'sedan' },
    Outlander: { class: 'small_suv' },
    'Outlander Sport': { class: 'small_suv' },
    Eclipse: { class: 'small_suv' },
    'Eclipse Cross': { class: 'small_suv' },
  },

  // --- NISSAN ---
  Nissan: {
    Sentra: { class: 'sedan' },
    Altima: { class: 'sedan' },
    Maxima: { class: 'sedan' },
    Versa: { class: 'sedan' },
    Leaf: { class: 'sedan' },
    Z: { class: 'sedan' },
    '370Z': { class: 'sedan' },
    GT: { class: 'sedan' },
    'GT-R': { class: 'sedan' },
    Kicks: { class: 'small_suv' },
    Rogue: { class: 'small_suv' },
    'Rogue Sport': { class: 'small_suv' },
    Murano: { class: 'large_suv' },
    Pathfinder: { class: 'large_suv' },
    Armada: { class: 'large_suv' },
    Ariya: { class: 'small_suv' },
    Frontier: { class: 'truck_van' },
    Titan: { class: 'truck_van' },
    NV: { class: 'truck_van' },
  },

  // --- POLESTAR ---
  Polestar: {
    '2': { class: 'sedan' },
    '3': { class: 'large_suv' },
  },

  // --- PORSCHE ---
  Porsche: {
    '911': { class: 'sedan' },
    '718': { class: 'sedan' },
    Taycan: { class: 'sedan' },
    Panamera: { class: 'sedan' },
    Macan: { class: 'small_suv' },
    Cayenne: { class: 'large_suv' },
  },

  // --- RAM ---
  Ram: {
    '1500': { class: 'truck_van' },
    '2500': { class: 'truck_van' },
    '3500': { class: 'truck_van' },
    ProMaster: { class: 'truck_van' },
    'ProMaster City': { class: 'truck_van' },
  },

  // --- RIVIAN ---
  Rivian: {
    R1S: { class: 'large_suv' },
    R1T: { class: 'truck_van' },
    R2: { class: 'small_suv' },
  },

  // --- SUBARU ---
  Subaru: {
    Impreza: { class: 'sedan' },
    Legacy: { class: 'sedan' },
    WRX: { class: 'sedan' },
    BRZ: { class: 'sedan' },
    Crosstrek: { class: 'small_suv' },
    Forester: { class: 'small_suv' },
    Outback: { class: 'small_suv' },
    Solterra: { class: 'small_suv' },
    Ascent: { class: 'large_suv' },
  },

  // --- TESLA ---
  Tesla: {
    'Model 3': { class: 'sedan' },
    'Model S': { class: 'sedan' },
    'Model Y': { class: 'small_suv' },
    'Model X': { class: 'large_suv' },
    Cybertruck: { class: 'truck_van' },
  },

  // --- TOYOTA ---
  Toyota: {
    Corolla: { class: 'sedan' },
    Camry: { class: 'sedan' },
    Avalon: { class: 'sedan' },
    Prius: { class: 'sedan' },
    GR86: { class: 'sedan' },
    Supra: { class: 'sedan' },
    Crown: { class: 'sedan' },
    'bZ4X': { class: 'small_suv' },
    'C-HR': { class: 'small_suv' },
    'Corolla Cross': { class: 'small_suv' },
    RAV4: { class: 'small_suv' },
    Venza: { class: 'small_suv' },
    Highlander: { class: 'large_suv' },
    '4Runner': { class: 'large_suv' },
    'Grand Highlander': { class: 'large_suv' },
    Sequoia: { class: 'large_suv' },
    'Land Cruiser': { class: 'large_suv' },
    Tacoma: { class: 'truck_van' },
    Tundra: { class: 'truck_van' },
    Sienna: { class: 'truck_van' },
  },

  // --- VOLKSWAGEN ---
  Volkswagen: {
    Jetta: { class: 'sedan' },
    Passat: { class: 'sedan' },
    Arteon: { class: 'sedan' },
    Golf: { class: 'sedan' },
    GTI: { class: 'sedan' },
    'Golf R': { class: 'sedan' },
    'ID.4': { class: 'small_suv' },
    'ID.Buzz': { class: 'truck_van' },
    Taos: { class: 'small_suv' },
    Tiguan: { class: 'small_suv' },
    Atlas: { class: 'large_suv' },
    'Atlas Cross Sport': { class: 'large_suv' },
  },

  // --- VOLVO ---
  Volvo: {
    S60: { class: 'sedan' },
    S90: { class: 'sedan' },
    C40: { class: 'small_suv' },
    XC40: { class: 'small_suv' },
    XC60: { class: 'small_suv' },
    XC90: { class: 'large_suv' },
    EX30: { class: 'small_suv' },
    EX90: { class: 'large_suv' },
  },
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Get all known makes (sorted) */
export function getVehicleMakes(): string[] {
  return Object.keys(VEHICLE_DATABASE).sort()
}

/** Get all models for a given make (sorted) */
export function getVehicleModels(make: string): string[] {
  const models = VEHICLE_DATABASE[make]
  if (!models) return []
  return Object.keys(models).sort()
}

/** Auto-detect vehicle class from make + model. Returns null if unknown. */
export function detectVehicleClass(make: string, model: string): VehicleClass | null {
  const makeData = VEHICLE_DATABASE[make]
  if (!makeData) return null

  // Exact match
  if (makeData[model]) return makeData[model].class

  // Case-insensitive partial match
  const lowerModel = model.toLowerCase()
  for (const [key, info] of Object.entries(makeData)) {
    if (key.toLowerCase() === lowerModel) return info.class
    if (key.toLowerCase().includes(lowerModel) || lowerModel.includes(key.toLowerCase())) {
      return info.class
    }
  }

  return null
}

/** Search makes by prefix (for autocomplete) */
export function searchMakes(query: string): string[] {
  if (!query) return getVehicleMakes()
  const lower = query.toLowerCase()
  return getVehicleMakes().filter((m) => m.toLowerCase().startsWith(lower))
}

/** Search models by prefix for a given make (for autocomplete) */
export function searchModels(make: string, query: string): string[] {
  const models = getVehicleModels(make)
  if (!query) return models
  const lower = query.toLowerCase()
  return models.filter((m) => m.toLowerCase().includes(lower))
}
