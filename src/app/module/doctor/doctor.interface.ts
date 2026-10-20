export interface DoctorInterface {
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  experienceYears: number;
  user: Record<string, any>;
}
