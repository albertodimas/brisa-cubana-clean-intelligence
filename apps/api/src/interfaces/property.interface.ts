export interface CreatePropertyDto {
  label: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  type: "RESIDENTIAL" | "VACATION_RENTAL" | "OFFICE";
  ownerId: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  notes?: string | null;
}

export type UpdatePropertyDto = Partial<CreatePropertyDto>;

export interface PropertyOwner {
  id: string;
  email: string;
  fullName: string | null;
}

export interface PropertyResponse extends CreatePropertyDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: PropertyOwner;
}

export interface PropertyPagination {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PropertyPaginationParams {
  limit?: number;
  cursor?: string;
}

export interface IPropertyRepository {
  findMany(
    pagination?: PropertyPaginationParams,
  ): Promise<{ data: PropertyResponse[]; pagination: PropertyPagination }>;
  findById(id: string): Promise<PropertyResponse | null>;
  create(data: CreatePropertyDto): Promise<PropertyResponse>;
  update(id: string, data: UpdatePropertyDto): Promise<PropertyResponse>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<PropertyResponse>;
}
