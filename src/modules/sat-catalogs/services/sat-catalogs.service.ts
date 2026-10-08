import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IPage,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import {
  resolvePagination,
  toPage,
} from '../../../shared/pagination/paginated.interface.js';
import type { ListSatCatalogQueryDto } from '../dtos/list-sat-catalog-query.dto.js';
import type {
  IClaveProdServ,
  IClaveUnidad,
  IObjetoImp,
} from '../interfaces/sat-catalog.interface.js';
import {
  SAT_CATALOGS_REPOSITORY,
  type IListSatCatalog,
  type ISatCatalogsRepository,
} from '../interfaces/sat-catalogs-repository.interface.js';

@Injectable()
export class SatCatalogsService {
  constructor(
    @Inject(SAT_CATALOGS_REPOSITORY)
    private readonly satCatalogsRepository: ISatCatalogsRepository,
  ) {}

  async findAllClavesProdServ(
    query: ListSatCatalogQueryDto,
  ): Promise<IPage<IClaveProdServ>> {
    return toPage(
      await this.satCatalogsRepository.findAllClavesProdServ(toFilter(query)),
      resolvePagination(query),
    );
  }

  async findClaveProdServ(clave: string): Promise<IClaveProdServ> {
    const record: IClaveProdServ | null =
      await this.satCatalogsRepository.findClaveProdServ(clave);

    if (!record) {
      throw new NotFoundException(
        `La clave de producto o servicio ${clave} no existe en el catálogo.`,
      );
    }

    return record;
  }

  async findAllClavesUnidad(
    query: ListSatCatalogQueryDto,
  ): Promise<IPage<IClaveUnidad>> {
    return toPage(
      await this.satCatalogsRepository.findAllClavesUnidad(toFilter(query)),
      resolvePagination(query),
    );
  }

  async findClaveUnidad(clave: string): Promise<IClaveUnidad> {
    const record: IClaveUnidad | null =
      await this.satCatalogsRepository.findClaveUnidad(clave);

    if (!record) {
      throw new NotFoundException(
        `La clave de unidad ${clave} no existe en el catálogo.`,
      );
    }

    return record;
  }

  async findAllObjetosImp(
    query: ListSatCatalogQueryDto,
  ): Promise<IPage<IObjetoImp>> {
    return toPage(
      await this.satCatalogsRepository.findAllObjetosImp(toFilter(query)),
      resolvePagination(query),
    );
  }

  async findObjetoImp(clave: string): Promise<IObjetoImp> {
    const record: IObjetoImp | null =
      await this.satCatalogsRepository.findObjetoImp(clave);

    if (!record) {
      throw new NotFoundException(
        `El objeto de impuesto ${clave} no existe en el catálogo.`,
      );
    }

    return record;
  }
}

function toFilter(query: ListSatCatalogQueryDto): IListSatCatalog {
  const pagination: IPagination = resolvePagination(query);

  return {
    pagina: pagination.pagina,
    limite: pagination.limite,
    busqueda: query.busqueda,
  };
}
