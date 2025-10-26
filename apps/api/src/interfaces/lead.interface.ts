import type { Lead, LeadStatus } from "@prisma/client";

export type LeadResponse = Lead;

export type CreateLeadInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  propertyCount?: string;
  serviceInterest?: string;
  notes?: string;
  status?: LeadStatus;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export interface ILeadRepository {
  create(input: CreateLeadInput): Promise<LeadResponse>;
  findMany(): Promise<LeadResponse[]>;
  findById(id: string): Promise<LeadResponse | null>;
}
