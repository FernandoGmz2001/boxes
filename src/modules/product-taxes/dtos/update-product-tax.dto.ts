import { IsInt, Min } from 'class-validator';

export class UpdateProductTaxDto {
  @IsInt()
  @Min(1)
  impuesto_preset_id: number;
}
