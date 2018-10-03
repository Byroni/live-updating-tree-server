const { pool } = require("./mysql");

function getTree(cb) {
  let query = `
        SELECT
            F.id,
            F.name,
            GROUP_CONCAT(C.value ORDER BY C.value ASC SEPARATOR ',') AS children
        FROM
            Factories F
            LEFT JOIN Factories_Children FC ON (FC.factoryID = F.id)
            LEFT JOIN Children C ON (C.id = FC.childID)
        GROUP BY
            id
    `;

  var tree = {};

  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(query, (err, res) => {
      connection.release();
      if (err) throw err;

      res.forEach(factory => {
        if (factory.children != null)
          factory.children = factory.children.split(",");
      });

      tree.root = res;

      cb(tree);
    });
  });
}

function createFactory(name, cb) {
  let query = `
        INSERT INTO Factories (name)
        VALUES (?)
    `;

  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(query, [name], err => {
      connection.release();
      if (err) throw err;

      cb();
    });
  });
}

function deleteFactory(id, cb) {
  let query = `
        DELETE FROM Factories
        WHERE id = ?
    `;

  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(query, [id], err => {
      connection.release();
      if (err) throw err;

      cb();
    });
  });
}

module.exports = {
  getTree,
  createFactory,
  deleteFactory
};
