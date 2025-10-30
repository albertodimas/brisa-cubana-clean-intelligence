import type { PrismaClient } from "@prisma/client";
import type {
  CreateLeadInput,
  ILeadRepository,
  LeadResponse,
  UpdateLeadInput,
} from "../interfaces/lead.interface.js";

export class LeadRepository implements ILeadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateLeadInput): Promise<LeadResponse> {
    return await this.prisma.lead.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        propertyCount: input.propertyCount,
        serviceInterest: input.serviceInterest,
        planCode: input.planCode,
        notes: input.notes,
        status: input.status ?? "NEW",
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
      },
    });
  }

  async findMany(): Promise<LeadResponse[]> {
    return await this.prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<LeadResponse | null> {
    return await this.prisma.lead.findUnique({
      where: { id },
    });
  }

  async update(id: string, input: UpdateLeadInput): Promise<LeadResponse> {
    return await this.prisma.lead.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        propertyCount: input.propertyCount,
        serviceInterest: input.serviceInterest,
        planCode: input.planCode,
        notes: input.notes,
        status: input.status,
      },
    });
  }
}
