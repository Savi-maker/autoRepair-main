export const ENGINE_MODEL_KEY = "v8_engine_v1" as const;

export type EnginePartDefinition = {
  key: string;
  label: string;
  technicalNames: string[];
};

export const ENGINE_PARTS: EnginePartDefinition[] = [
  { key: "alternator", label: "Alternator", technicalNames: ["Alternator.2_12", "Alternator_13"] },
  { key: "drive_belt", label: "Pasek napędowy", technicalNames: ["Belt_11"] },
  { key: "engine_block", label: "Blok silnika", technicalNames: ["Block_3"] },
  { key: "cylinder_head", label: "Głowica silnika", technicalNames: ["Head_0", "Heads"] },
  { key: "oil_pan", label: "Misa olejowa", technicalNames: ["Oil pan_2", "Oil pan.3_30", "Oil pan.4_31", "Oil pan.2_32"] },
  { key: "spark_plugs", label: "Świece zapłonowe", technicalNames: ["Spark plugs_14", "Spark_plugs"] },
  { key: "turbocharger", label: "Turbosprężarka", technicalNames: ["Turbo_22", "Turbo.2_24", "Turbo.4_28", "Turbo.3_29"] },
  { key: "intake_manifold", label: "Kolektor dolotowy", technicalNames: ["Intake.4_1", "Intake_20", "Intake.3_27"] },
  { key: "air_filter", label: "Filtr powietrza", technicalNames: ["Intake.5_33", "Filter"] },
  { key: "throttle_body", label: "Przepustnica", technicalNames: ["Intake.2_34", "Throttle_body"] },
  { key: "oil_dipstick", label: "Bagnet oleju", technicalNames: ["Dip stick_5", "Dipstick"] },
  { key: "valve_cover", label: "Pokrywa zaworów", technicalNames: ["Valve covers.2_6", "Valve covers_18", "Valve_covers"] },
  { key: "distributor", label: "Rozdzielacz zapłonu", technicalNames: ["Distributor_7"] },
  { key: "transmission", label: "Skrzynia biegów", technicalNames: ["Transmission_8"] },
  { key: "fuel_pump", label: "Pompa paliwa", technicalNames: ["Fuel pump_9"] },
  { key: "oil_pump", label: "Pompa olejowa", technicalNames: ["Oil_pump"] },
  { key: "pulleys", label: "Koła pasowe", technicalNames: ["Pulleys_10"] },
  { key: "ignition_wires", label: "Przewody zapłonowe", technicalNames: ["Distributor.4_15", "Distributor.3_16", "Distributor.2_17", "Ignition_wires"] },
  { key: "exhaust_manifold", label: "Kolektor wydechowy", technicalNames: ["Headers.3_19", "Headers_23", "Headers.2_26"] },
  { key: "fuel_lines", label: "Przewody paliwowe", technicalNames: ["Lines_21"] },
  { key: "exhaust_system", label: "Układ wydechowy", technicalNames: ["Exhaust_25"] },
];

export const ENGINE_PART_KEYS = new Set(ENGINE_PARTS.map((part) => part.key));