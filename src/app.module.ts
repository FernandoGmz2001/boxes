import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CashRegistersModule } from './modules/cash-registers/cash-registers.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { MovementsModule } from './modules/movements/movements.module.js';
import { ProductTaxesModule } from './modules/product-taxes/product-taxes.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { SatCatalogsModule } from './modules/sat-catalogs/sat-catalogs.module.js';
import { ShiftsModule } from './modules/shifts/shifts.module.js';
import { TaxesModule } from './modules/taxes/taxes.module.js';
import { UnitsModule } from './modules/units/units.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? [`.env.${process.env.NODE_ENV}`, '.env']
        : '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CategoriesModule,
    ProductsModule,
    ProductTaxesModule,
    TaxesModule,
    UnitsModule,
    SatCatalogsModule,
    MovementsModule,
    CashRegistersModule,
    ShiftsModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
