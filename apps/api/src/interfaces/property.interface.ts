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

export interface PropertySearchParams extends PropertyPaginationParams {
  search?: string;
  city?: string;
  type?: CreatePropertyDto["type"];
  ownerId?: string;
}

export interface IPropertyRepository {
  findMany(
    pagination?: PropertyPaginationParams,
    tenantId?: string,
  ): Promise<{ data: PropertyResponse[]; pagination: PropertyPagination }>;
  findById(id: string, tenantId?: string): Promise<PropertyResponse | null>;
  create(data: CreatePropertyDto, tenantId?: string): Promise<PropertyResponse>;
  update(
    id: string,
    data: UpdatePropertyDto,
    tenantId?: string,
  ): Promise<PropertyResponse>;
  delete(id: string, tenantId?: string): Promise<void>;
  restore(id: string, tenantId?: string): Promise<PropertyResponse>;
  findManyWithSearch(
    params: PropertySearchParams,
    tenantId?: string,
  ): Promise<{ data: PropertyResponse[]; pagination: PropertyPagination }>;
  findByOwner(ownerId: string, tenantId?: string): Promise<PropertyResponse[]>;
}
