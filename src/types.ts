export interface ChatMessage {
  id: string;
  role: 'user' | 'tree' | 'assistant';
  content: string;
  timestamp: number;
  treeId: string;
  userId?: string;
}

export type TreeCategory = 'ทั้งหมด' | 'ไม้ผล' | 'ไม้ยืนต้น' | 'ไม้เลื้อย' | 'เฟิร์น' | 'ไม้ดอก' | 'ไม้พุ่ม' | 'ไม้ล้มลุก' | 'กระบองเพชร';

export interface TreeNote {
  id: string;
  userId: string;
  treeId: string;
  treeName: string;
  treeIcon?: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ScientificData {
  scientificName: string;
  commonNameEn: string;
  family: string;
  familyThai?: string;
  genus: string;
  species: string;
  origin: string;
  distribution: string;
  ecologicalRole: string;
  plantHabit: string;
}
