import { sqliteTable, text, integer, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const products = sqliteTable('products', { id: text('id').primaryKey(), data: text('data').notNull(), active: integer('active').notNull().default(1) });
export const variants = sqliteTable('variants', { id: text('id').primaryKey(), productId: text('product_id').notNull(), name: text('name').notNull(), price: integer('price').notNull(), stock: integer('stock').notNull() }, t => [check('nonnegative_stock', sql `${t.stock} >= 0`)]);
export const settings = sqliteTable('settings', { id: text('id').primaryKey(), data: text('data').notNull() });
export const orders = sqliteTable('orders', { id: text('id').primaryKey(), token: text('token').notNull().unique(), data: text('data').notNull(), total: integer('total').notNull(), demo: integer('demo').notNull(), status: text('status').notNull().default('menunggu konfirmasi'), payment: text('payment').notNull().default('belum dibayar'), tracking: text('tracking').notNull().default(''), created: text('created').notNull() });
