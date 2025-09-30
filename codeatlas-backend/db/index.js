import pkg from 'pg'; // destructure Pool from pg if needed
const { Pool } = pkg;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "codeatlas",
    password: "karan13",
    port: 5432,
});

export default pool;