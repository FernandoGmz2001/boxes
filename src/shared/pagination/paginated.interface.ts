export const DEFAULT_PAGE: number = 1;
export const DEFAULT_LIMIT: number = 20;

export interface IPagination {
  pagina: number;
  limite: number;
}

export interface IPage<T> {
  data: T[];
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

export interface IPageResult<T> {
  items: T[];
  total: number;
}

export function resolvePagination(query: {
  pagina?: number;
  limite?: number;
}): IPagination {
  return {
    pagina: query.pagina ?? DEFAULT_PAGE,
    limite: query.limite ?? DEFAULT_LIMIT,
  };
}

export function toPage<T>(
  result: IPageResult<T>,
  pagination: IPagination,
): IPage<T> {
  return {
    data: result.items,
    pagina: pagination.pagina,
    limite: pagination.limite,
    total: result.total,
    total_paginas:
      result.total === 0 ? 0 : Math.ceil(result.total / pagination.limite),
  };
}
