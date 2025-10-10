export interface CreateServiceDto {
  name: string;
  description: string;
  durationMinutes: number;
  priceUsd: number;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  durationMinutes?: number;
  priceUsd?: number;
}

export interface ServiceResponse {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceRepository {
  findMany(pagination: { limit?: number; cursor?: string }): Promise<{
    data: ServiceResponse[];
    pagination: {
      limit: number;
      cursor: string | null;
      nextCursor: string | null;
      hasMore: boolean;
    };
  }>;
  findById(id: string): Promise<ServiceResponse | null>;
  create(data: CreateServiceDto): Promise<ServiceResponse>;
  update(id: string, data: UpdateServiceDto): Promise<ServiceResponse>;
  delete(id: string): Promise<void>;
}
