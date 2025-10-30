import type { Lead, LeadStatus } from "@prisma/client";

export type LeadResponse = Lead;

export type CreateLeadInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  propertyCount?: string;
  serviceInterest?: string;
  planCode?: string;
  notes?: string;
  status?: LeadStatus;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export type UpdateLeadInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  company?: string | null;
  propertyCount?: string | null;
  serviceInterest?: string | null;
  planCode?: string | null;
  notes?: string | null;
  status?: LeadStatus;
};

export interface ILeadRepository {
  create(input: CreateLeadInput): Promise<LeadResponse>;
  findMany(): Promise<LeadResponse[]>;
  findById(id: string): Promise<LeadResponse | null>;
  update(id: string, input: UpdateLeadInput): Promise<LeadResponse>;
}
