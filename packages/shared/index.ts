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