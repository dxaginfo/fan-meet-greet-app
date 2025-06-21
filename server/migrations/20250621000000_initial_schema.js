/**
 * Initial database schema migration for the Fan Meet & Greet Manager
 */
exports.up = function (knex) {
  return knex.schema
    // Users table
    .createTable('users', (table) => {
      table.uuid('user_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.enum('user_type', ['artist', 'fan', 'manager']).notNullable();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('profile_image_url');
      table.timestamps(true, true);
    })

    // Artists table
    .createTable('artists', (table) => {
      table.uuid('artist_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
      table.string('artist_name').notNullable();
      table.text('bio');
      table.jsonb('social_media_links').defaultTo('{}');
      table.jsonb('preferences').defaultTo('{}');
      table.decimal('commission_rate', 5, 2).defaultTo(0);
      table.timestamps(true, true);
    })

    // Fans table
    .createTable('fans', (table) => {
      table.uuid('fan_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
      table.jsonb('preferences').defaultTo('{}');
      table.text('accessibility_requirements');
      table.string('payment_token');
      table.timestamps(true, true);
    })

    // Venues table
    .createTable('venues', (table) => {
      table.uuid('venue_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('venue_name').notNullable();
      table.string('address').notNullable();
      table.string('city').notNullable();
      table.string('state').notNullable();
      table.string('country').notNullable();
      table.string('postal_code').notNullable();
      table.integer('capacity').unsigned();
      table.jsonb('contact_info').defaultTo('{}');
      table.timestamps(true, true);
    })

    // Events table
    .createTable('events', (table) => {
      table.uuid('event_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('artist_id').notNullable().references('artist_id').inTable('artists').onDelete('CASCADE');
      table.string('event_name').notNullable();
      table.enum('event_type', ['in-person', 'virtual', 'hybrid']).notNullable();
      table.text('description');
      table.uuid('venue_id').references('venue_id').inTable('venues').onDelete('SET NULL');
      table.integer('max_capacity').unsigned();
      table.boolean('is_published').defaultTo(false);
      table.timestamps(true, true);
    })

    // Sessions table
    .createTable('sessions', (table) => {
      table.uuid('session_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('event_id').notNullable().references('event_id').inTable('events').onDelete('CASCADE');
      table.timestamp('start_time').notNullable();
      table.timestamp('end_time').notNullable();
      table.integer('duration_minutes').unsigned().notNullable();
      table.integer('capacity').unsigned().notNullable();
      table.enum('status', ['scheduled', 'in-progress', 'completed', 'cancelled']).defaultTo('scheduled');
      table.enum('session_type', ['group', 'individual']).notNullable();
      table.string('virtual_room_id');
      table.timestamps(true, true);
    })

    // Tickets table
    .createTable('tickets', (table) => {
      table.uuid('ticket_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('session_id').notNullable().references('session_id').inTable('sessions').onDelete('CASCADE');
      table.uuid('fan_id').notNullable().references('fan_id').inTable('fans').onDelete('CASCADE');
      table.timestamp('purchase_time').defaultTo(knex.fn.now());
      table.decimal('ticket_price', 10, 2).notNullable();
      table.enum('status', ['purchased', 'cancelled', 'used']).defaultTo('purchased');
      table.string('access_code');
      table.boolean('is_waitlist').defaultTo(false);
      table.timestamps(true, true);
    })

    // Merchandise table
    .createTable('merchandise', (table) => {
      table.uuid('merchandise_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('artist_id').notNullable().references('artist_id').inTable('artists').onDelete('CASCADE');
      table.string('item_name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.string('image_url');
      table.integer('inventory_count').unsigned().defaultTo(0);
      table.boolean('is_available').defaultTo(true);
      table.timestamps(true, true);
    })

    // Merchandise Orders table
    .createTable('merchandise_orders', (table) => {
      table.uuid('order_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('ticket_id').references('ticket_id').inTable('tickets').onDelete('SET NULL');
      table.uuid('merchandise_id').notNullable().references('merchandise_id').inTable('merchandise').onDelete('CASCADE');
      table.integer('quantity').unsigned().notNullable();
      table.decimal('price_at_purchase', 10, 2).notNullable();
      table.boolean('is_signed').defaultTo(false);
      table.enum('status', ['ordered', 'fulfilled']).defaultTo('ordered');
      table.timestamps(true, true);
    })

    // Transactions table
    .createTable('transactions', (table) => {
      table.uuid('transaction_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.enum('transaction_type', ['ticket', 'merchandise', 'refund']).notNullable();
      table.string('payment_method').notNullable();
      table.string('payment_status').notNullable();
      table.uuid('reference_id').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // Media table
    .createTable('media', (table) => {
      table.uuid('media_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('session_id').notNullable().references('session_id').inTable('sessions').onDelete('CASCADE');
      table.uuid('fan_id').references('fan_id').inTable('fans').onDelete('SET NULL');
      table.enum('media_type', ['photo', 'video', 'autograph']).notNullable();
      table.string('url').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.boolean('is_shared').defaultTo(false);
      table.integer('download_count').unsigned().defaultTo(0);
    })

    // Notifications table
    .createTable('notifications', (table) => {
      table.uuid('notification_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
      table.string('notification_type').notNullable();
      table.text('content').notNullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.string('action_url');
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('media')
    .dropTableIfExists('transactions')
    .dropTableIfExists('merchandise_orders')
    .dropTableIfExists('merchandise')
    .dropTableIfExists('tickets')
    .dropTableIfExists('sessions')
    .dropTableIfExists('events')
    .dropTableIfExists('venues')
    .dropTableIfExists('fans')
    .dropTableIfExists('artists')
    .dropTableIfExists('users');
};