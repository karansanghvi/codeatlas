const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "codeatlas",
    password: "karan13",
    port: 5432,
});

module.exports = pool;