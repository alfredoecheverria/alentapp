// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
  id: string; // UUID
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
  status: MemberStatus;
  created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
}

export interface UpdateMemberRequest {
  dni?: string;
  name?: string;
  email?: string;
  birthdate?: string; // ISO Date String (YYYY-MM-DD)
  category?: MemberCategory;
  status?: MemberStatus;
}


// ==========================================
// Equipment-Loan
// ==========================================

export type EquipmentLoanStatus = 'Loaned' | 'Returned' | 'Damaged';

export interface EquipmentLoanDTO {
  id: string; // UUID
  item_name: string;
  status: EquipmentLoanStatus;
  loan_date: string; // ISO Date String (YYYY-MM-DD)
  due_date: string; // ISO Date String (YYYY-MM-DD)
  member_id: string;
}

export interface CreateEquipmentLoanRequest {
  item_name: string;
  status: EquipmentLoanStatus;
  loan_date: string; // ISO Date String (YYYY-MM-DD)
  due_date: string; // ISO Date String (YYYY-MM-DD)
  member_id: string;
}

// ==========================================
// Sport
// ==========================================
export interface SportDTO {
  id: string; // UUID
  name: string;
  description: string;
  max_capacity: number;
  additional_price: float;
  requires_medical_certificate: boolean;
}

export interface CreateSportRequest {
  name: string;
  description: string;
  max_capacity: number;
  additional_price?: float | null;
  requires_medical_certificate: boolean;
}

// ==========================================
// Locker
// ==========================================
export type LockerStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface LockerDTO {
  id: string; // UUID
  number: number;
  location: string;
  status: LockerStatus;
  member_id?: string;
  member?: MemberDTO;
}

export interface CreateLockerRequest {
  number: number;
  location: string;
  status?: LockerStatus;
  member_id?: string;
}

// ==========================================
// Discipline
// ==========================================

export interface DisciplineDTO {
  id: string; // UUID
  reason: string;
  start_date: string; // ISO Date String
  end_date: string; // ISO Date String
  is_total_suspension: boolean;
  member_id: string; // UUID del miembro sancionado
  deactivated_at: string | null; // ISO Date String o null si sigue activo
}

export interface CreateDisciplineRequest {
  member_id: string; // UUID del miembro sancionado
  reason: string;
  start_date: string; // ISO Date String
  end_date: string; // ISO Date String
  is_total_suspension: boolean;
}
