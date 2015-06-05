// Update with your config settings.

module.exports = {

  client: 'postgresql',
  connection: {
    database: 'knex_test',
    user    : 'tim',
    password: 'Parker1129'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }

};
