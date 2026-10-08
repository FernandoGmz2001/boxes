import { Controller, Get, Param, Query } from '@nestjs/common';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { ListSatCatalogQueryDto } from '../dtos/list-sat-catalog-query.dto.js';
import type {
  IClaveProdServ,
  IClaveUnidad,
  IObjetoImp,
} from '../interfaces/sat-catalog.interface.js';
import { SatCatalogsService } from '../services/sat-catalogs.service.js';

@Controller('claves-producto-servicio')
export class ProductServiceKeysController {
  constructor(private readonly satCatalogsService: SatCatalogsService) {}

  @Get()
  async findAll(
    @Query() query: ListSatCatalogQueryDto,
  ): Promise<IPage<IClaveProdServ>> {
    return this.satCatalogsService.findAllClavesProdServ(query);
  }

  @Get(':clave')
  async findOne(@Param('clave') clave: string): Promise<IClaveProdServ> {
    return this.satCatalogsService.findClaveProdServ(clave);
  }
}

@Controller('claves-unidad')
export class UnitKeysController {
  constructor(private readonly satCatalogsService: SatCatalogsService) {}

  @Get()
  async findAll(
    @Query() query: ListSatCatalogQueryDto,
  ): Promise<IPage<IClaveUnidad>> {
    return this.satCatalogsService.findAllClavesUnidad(query);
  }

  @Get(':clave')
  async findOne(@Param('clave') clave: string): Promise<IClaveUnidad> {
    return this.satCatalogsService.findClaveUnidad(clave);
  }
}

@Controller('objetos-impuesto')
export class TaxObjectsController {
  constructor(private readonly satCatalogsService: SatCatalogsService) {}

  @Get()
  async findAll(
    @Query() query: ListSatCatalogQueryDto,
  ): Promise<IPage<IObjetoImp>> {
    return this.satCatalogsService.findAllObjetosImp(query);
  }

  @Get(':clave')
  async findOne(@Param('clave') clave: string): Promise<IObjetoImp> {
    return this.satCatalogsService.findObjetoImp(clave);
  }
}
