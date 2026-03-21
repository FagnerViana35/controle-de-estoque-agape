/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .createTable('users', table => {
      table.string('id').primary();
      table.string('username').notNullable().unique();
      table.string('password').notNullable();
    })
    .createTable('raw_materials', table => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('unit').defaultTo('kg');
      table.float('quantity_in_stock').defaultTo(0);
      table.float('unit_cost').defaultTo(0);
      table.text('observation');
      table.timestamps(true, true);
    })
    .createTable('products', table => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.float('price').notNullable();
      table.float('stock_quantity').defaultTo(0);
      table.timestamps(true, true);
    })
    .createTable('recipes', table => {
      table.string('id').primary();
      table.string('product_id').references('id').inTable('products').onDelete('CASCADE');
      table.string('raw_material_id').references('id').inTable('raw_materials').onDelete('CASCADE');
      table.float('quantity_required').notNullable();
    })
    .createTable('customers', table => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('phone');
      table.string('email');
      table.text('address');
      table.timestamps(true, true);
    })
    .createTable('production', table => {
      table.string('id').primary();
      table.string('product_id').references('id').inTable('products').onDelete('CASCADE');
      table.float('quantity_produced').notNullable();
      table.timestamp('production_date').defaultTo(knex.fn.now());
    })
    .createTable('stock_movements', table => {
      table.string('id').primary();
      table.string('type').notNullable();
      table.string('raw_material_id').references('id').inTable('raw_materials').onDelete('SET NULL');
      table.string('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.float('quantity').notNullable();
      table.timestamp('date').defaultTo(knex.fn.now());
    })
    .createTable('sales', table => {
      table.string('id').primary();
      table.string('customer_id').references('id').inTable('customers').onDelete('SET NULL');
      table.timestamp('sale_date').defaultTo(knex.fn.now());
      table.float('total_value').notNullable();
    })
    .createTable('sale_items', table => {
      table.string('id').primary();
      table.string('sale_id').references('id').inTable('sales').onDelete('CASCADE');
      table.string('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.float('quantity').notNullable();
      table.float('unit_price').notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .dropTableIfExists('sale_items')
    .dropTableIfExists('sales')
    .dropTableIfExists('stock_movements')
    .dropTableIfExists('production')
    .dropTableIfExists('customers')
    .dropTableIfExists('recipes')
    .dropTableIfExists('products')
    .dropTableIfExists('raw_materials')
    .dropTableIfExists('users');
};
