/**
 * Interfaz base para repositorios
 *
 * Define las operaciones CRUD comunes que todos los repositorios deben implementar.
 * Sigue el patrón Repository para abstraer el acceso a datos.
 */

export interface BaseRepository<T, CreateInput, UpdateInput> {
  /**
   * Busca un registro por ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Busca múltiples registros con opciones de paginación
   */
  findMany(options?: FindManyOptions): Promise<T[]>;

  /**
   * Crea un nuevo registro
   */
  create(data: CreateInput): Promise<T>;

  /**
   * Actualiza un registro existente
   */
  update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Cuenta el total de registros que cumplen con ciertos criterios
   */
  count(where?: any): Promise<number>;

  /**
   * Marca un registro como eliminado lógicamente
   */
  delete(id: string): Promise<void>;

  /**
   * Restaura un registro eliminado lógicamente
   */
  restore(id: string): Promise<T>;
}

/**
 * Opciones para paginación y filtros
 */
export interface FindManyOptions {
  take?: number;
  skip?: number;
  cursor?: { id: string };
  where?: any;
  include?: any;
  orderBy?: any;
}

/**
 * Resultado paginado con cursor
 */
export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}
