require("dotenv").config();

var mysql = require("mysql");
var pool = mysql.createPool({
  connectionLimit: 10, //  JawsDB free tier max
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB
});

module.exports = {
  pool
};
