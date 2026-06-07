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
// Payment
// ==========================================
export type PaymentStatus = 'Pendiente' | 'Pago' | 'Cancelado';

export interface PaymentDTO {
  id: string; // UUID
  member_id: string; // UUID del miembro que realizó el pago
  amount: number; // Monto del pago
  status: PaymentStatus;
  due_date: string; // Fecha de vencimiento del pago (ISO Date String)
  payment_date: string; // Fecha en que se realizó el pago (ISO Date String)
  year: number; // Año del pago
  month: number; // Mes del pago (1-12)
}

export interface CreatePaymentRequest {
  member_id: string;
  amount: number;
  status: PaymentStatus;
  due_date: string;
  payment_date: string;
  year: number;
  month: number;
}

export interface UpdatePaymentRequest {
  member_id?: string;
  amount?: number;
  status?: PaymentStatus;
  due_date?: string;
  payment_date?: string;
  year?: number;
  month?: number;
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

export interface UpdateEquipmentLoanRequest {
  item_name?: string;
  status?: EquipmentLoanStatus;
  loan_date?: string; // ISO Date String (YYYY-MM-DD)
  due_date?: string; // ISO Date String (YYYY-MM-DD)
  member_id?: string;
}

// ==========================================
// Sport
// ==========================================
export interface SportDTO {
  id: string; // UUID
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
}

export interface CreateSportRequest {
  name: string;
  description: string;
  max_capacity: number;
  additional_price?: number;
  requires_medical_certificate: boolean;
}

export interface UpdateSportRequest {
    description?: string;
    max_capacity?: number;
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

export interface UpdateLockerRequest {
  number?: number;
  location?: string;
  status?: LockerStatus;
  member_id?: string | null;
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

export interface UpdateDisciplineRequest {
  reason?: string;
  start_date?: string; // ISO Date String
  end_date?: string; // ISO Date String
  is_total_suspension?: boolean;
}

// ==========================================
// Enrollment
// ==========================================

export interface EnrollmentDTO {
    id: string; //UUID
    member_id: string; //UUID
    sport_id: string; //UUID
    enrollment_date: string; // ISO Date String
    is_active: boolean;
}

export interface CreateEnrollmentRequest {
    member_id: string; //UUID
    sport_id: string; //UUID
    enrollment_date: string; // ISO Date String
    is_active: boolean;
}

export interface UpdateEnrollmentRequest {
    enrollment_date?: string; // ISO Date String
    is_active?: boolean;
}

