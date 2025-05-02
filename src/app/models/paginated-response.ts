/**
 * Generic paginated response model for all paginated API endpoints
 * @template T Type of content items in the paginated response
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}