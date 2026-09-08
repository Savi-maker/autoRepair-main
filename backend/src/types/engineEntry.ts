export type EngineEntryKind = "customer_report" | "mechanic_diagnosis" | "repair_summary";

export type EngineEntryInput = {
  model_key: "v8_engine_v1";
  general_description: string;
  unknown_part: boolean;
  parts: Array<{ part_key: string; comment: string }>;
};

export type CreateEngineEntryInput = EngineEntryInput & {
  kind: EngineEntryKind;
  expected_revision: number;
};