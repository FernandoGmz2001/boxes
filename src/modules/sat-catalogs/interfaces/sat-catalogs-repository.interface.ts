import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import type {
  IClaveProdServ,
  IClaveUnidad,
  IObjetoImp,
} from './sat-catalog.interface.js';

export const SAT_CATALOGS_REPOSITORY: symbol = Symbol('SAT_CATALOGS_REPOSITORY');

export interface IListSatCatalog {
  pagina: number;
  limite: number;
  busqueda?: string;
}

export interface ISatCatalogsRepository {
  findAllClavesProdServ(
    filter: IListSatCatalog,
  ): Promise<IPageResult<IClaveProdServ>>;
  findClaveProdServ(clave: string): Promise<IClaveProdServ | null>;
  findAllClavesUnidad(
    filter: IListSatCatalog,
  ): Promise<IPageResult<IClaveUnidad>>;
  findClaveUnidad(clave: string): Promise<IClaveUnidad | null>;
  findAllObjetosImp(filter: IListSatCatalog): Promise<IPageResult<IObjetoImp>>;
  findObjetoImp(clave: string): Promise<IObjetoImp | null>;
}
