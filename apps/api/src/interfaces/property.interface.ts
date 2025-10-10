export interface CreatePropertyDto {
  label: string;
  address: string;
  ownerId: string;
}

export interface UpdatePropertyDto {
  label?: string;
  address?: string;
}

export interface PropertyResponse {
  id: string;
  label: string;
  address: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyRepository {
  findMany(pagination: { limit?: number; cursor?: string }): Promise<{
    data: PropertyResponse[];
    pagination: {
      limit: number;
      cursor: string | null;
      nextCursor: string | null;
      hasMore: boolean;
    };
  }>;
  findById(id: string): Promise<PropertyResponse | null>;
  create(data: CreatePropertyDto): Promise<PropertyResponse>;
  update(id: string, data: UpdatePropertyDto): Promise<PropertyResponse>;
  delete(id: string): Promise<void>;
}
