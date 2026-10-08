import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IPage, IPagination } from '../../../shared/pagination/paginated.interface.js';
import {
  resolvePagination,
  toPage,
} from '../../../shared/pagination/paginated.interface.js';
import type { CreateProductTaxDto } from '../dtos/create-product-tax.dto.js';
import type { ListProductTaxesQueryDto } from '../dtos/list-product-taxes-query.dto.js';
import type { UpdateProductTaxDto } from '../dtos/update-product-tax.dto.js';
import {
  PRODUCT_TAXES_REPOSITORY,
  type IProductTaxesRepository,
} from '../interfaces/product-taxes-repository.interface.js';
import type { IProductoImpuesto } from '../interfaces/producto-impuesto.interface.js';

@Injectable()
export class ProductTaxesService {
  constructor(
    @Inject(PRODUCT_TAXES_REPOSITORY)
    private readonly productTaxesRepository: IProductTaxesRepository,
  ) {}

  async findAllProductTaxes(
    productoId: number,
    query: ListProductTaxesQueryDto,
  ): Promise<IPage<IProductoImpuesto>> {
    await this.assertProductExists(productoId);
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.productTaxesRepository.findAll(productoId, pagination),
      pagination,
    );
  }

  async findProductTaxById(
    productoId: number,
    id: number,
  ): Promise<IProductoImpuesto> {
    await this.assertProductExists(productoId);

    return this.assertTaxExists(productoId, id);
  }

  async createProductTax(
    productoId: number,
    createProductTaxDto: CreateProductTaxDto,
  ): Promise<IProductoImpuesto> {
    await this.assertProductExists(productoId);
    await this.assertPresetAvailable(
      productoId,
      createProductTaxDto.impuesto_preset_id,
    );

    return this.productTaxesRepository.create({
      producto_id: productoId,
      impuesto_preset_id: createProductTaxDto.impuesto_preset_id,
    });
  }

  async updateProductTax(
    productoId: number,
    id: number,
    updateProductTaxDto: UpdateProductTaxDto,
  ): Promise<IProductoImpuesto> {
    await this.assertProductExists(productoId);
    const current: IProductoImpuesto = await this.assertTaxExists(
      productoId,
      id,
    );

    if (current.impuesto_preset_id !== updateProductTaxDto.impuesto_preset_id) {
      await this.assertPresetAvailable(
        productoId,
        updateProductTaxDto.impuesto_preset_id,
      );
    }

    return this.productTaxesRepository.update(id, {
      impuesto_preset_id: updateProductTaxDto.impuesto_preset_id,
    });
  }

  async deleteProductTax(productoId: number, id: number): Promise<void> {
    await this.assertProductExists(productoId);
    await this.assertTaxExists(productoId, id);
    await this.productTaxesRepository.delete(id);
  }

  private async assertProductExists(productoId: number): Promise<void> {
    const exists: boolean =
      await this.productTaxesRepository.productExists(productoId);

    if (!exists) {
      throw new NotFoundException(`Producto ${productoId} no existe.`);
    }
  }

  private async assertTaxExists(
    productoId: number,
    id: number,
  ): Promise<IProductoImpuesto> {
    const impuesto: IProductoImpuesto | null =
      await this.productTaxesRepository.findById(productoId, id);

    if (!impuesto) {
      throw new NotFoundException(`Impuesto ${id} no existe.`);
    }

    return impuesto;
  }

  private async assertPresetAvailable(
    productoId: number,
    impuestoPresetId: number,
  ): Promise<void> {
    const existing: IProductoImpuesto | null =
      await this.productTaxesRepository.findByPreset(
        productoId,
        impuestoPresetId,
      );

    if (existing) {
      throw new ConflictException(
        `El impuesto ${impuestoPresetId} ya está asignado al producto ${productoId}.`,
      );
    }
  }
}
