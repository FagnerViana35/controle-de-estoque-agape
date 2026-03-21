import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export const seed = async function(knex) {
  // Read current db.json
  const dbPath = path.resolve(__dirname, '../../../db.json');
  if (!fs.existsSync(dbPath)) {
    console.log('db.json not found, skipping seed.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Clear existing tables
  await knex('sale_items').del();
  await knex('sales').del();
  await knex('stock_movements').del();
  await knex('production').del();
  await knex('customers').del();
  await knex('recipes').del();
  await knex('products').del();
  await knex('raw_materials').del();
  await knex('users').del();

  // Insert users
  if (data.users && data.users.length > 0) {
    await knex('users').insert(data.users);
  }

  // Insert raw materials
  if (data['raw-materials'] && data['raw-materials'].length > 0) {
    await knex('raw_materials').insert(data['raw-materials'].map(m => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      quantity_in_stock: m.quantity_in_stock,
      unit_cost: m.unit_cost,
      observation: m.observation,
      created_at: m.created_at || new Date().toISOString()
    })));
  }

  // Insert products
  if (data.products && data.products.length > 0) {
    await knex('products').insert(data.products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock_quantity: p.stock_quantity,
      created_at: p.created_at || new Date().toISOString()
    })));
  }

  // Insert recipes
  if (data.recipes && data.recipes.length > 0) {
    await knex('recipes').insert(data.recipes);
  }

  // Insert customers
  if (data.customers && data.customers.length > 0) {
    await knex('customers').insert(data.customers);
  }

  // Insert production
  if (data.production && data.production.length > 0) {
    await knex('production').insert(data.production);
  }

  // Insert stock movements
  if (data['stock-movements'] && data['stock-movements'].length > 0) {
    await knex('stock_movements').insert(data['stock-movements']);
  }

  // Insert sales
  if (data.sales && data.sales.length > 0) {
    await knex('sales').insert(data.sales);
  }

  // Insert sale items
  if (data['sale-items'] && data['sale-items'].length > 0) {
    await knex('sale_items').insert(data['sale-items']);
  }
};
