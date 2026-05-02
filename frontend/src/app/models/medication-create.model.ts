export interface CreateMedicationRequest {
  name: string;
  genericName?: string | null;
  nationalDrugCode: string;
  form: string;
  strength: string;
  manufacturer: string;
}

export interface MedicationResponse {
  medicationId: number;
  name: string;
  genericName?: string | null;
  nationalDrugCode: string;
  form: string;
  strength: string;
  manufacturer: string;
}