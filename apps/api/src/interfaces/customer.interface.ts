export interface CustomerResponse {
  id: string;
  email: string;
  fullName: string | null;
}

export interface CustomerPagination {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CustomerPaginationParams {
  limit?: number;
  cursor?: string;
}

export interface CustomerSearchParams extends CustomerPaginationParams {
  search?: string;
}

export interface ICustomerRepository {
  findMany(
    params?: CustomerPaginationParams,
  ): Promise<{ data: CustomerResponse[]; pagination: CustomerPagination }>;
  findManyWithSearch(
    params: CustomerSearchParams,
  ): Promise<{ data: CustomerResponse[]; pagination: CustomerPagination }>;
}
