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
    if (err) return cb(null, err);
    connection.query(query, (err, res) => {
      connection.release();
      if (err) return cb(null, err);

      res.forEach(factory => {
        if (factory.children != null)
          factory.children = factory.children.split(",");
      });

      tree.root = res;

      cb(tree, null);
    });
  });
}

function createFactory(name, cb) {
  let query = `
        INSERT INTO Factories (name)
        VALUES (?)
    `;

  pool.getConnection((err, connection) => {
    if (err) return cb(err);
    connection.query(query, [name], err => {
      connection.release();
      if (err) return cb(err);

      cb(null);
    });
  });
}

function deleteFactory(id, cb) {
  let query = `
        DELETE FROM Factories
        WHERE id = ?
    `;

  pool.getConnection((err, connection) => {
    if (err) return cb(err);
    connection.query(query, [id], err => {
      connection.release();
      if (err) return cb(err);

      cb(null);
    });
  });
}

function changeFactoryName(id, name, cb) {
  let query = `
    UPDATE Factories
    SET name = ?
    WHERE
      id = ?
  `;

  pool.getConnection((err, connection) => {
    if (err) return cb(err);
    connection.query(query, [name, id], err => {
      connection.release();
      if (err) return cb(err);

      cb(null);
    });
  });
}

function generateChildren(id, children, cb) {
  let findChild = `
    SELECT
      id
    FROM
      Children
    WHERE
      value = ?
  `;

  let deleteMapping = `
    DELETE FROM Factories_Children
    WHERE
        factoryID = ?
      `;

  let createMapping = `
    INSERT INTO Factories_Children (childID, factoryID)
    VALUES (?, ?)
  `;

  let insertChildren = `
    INSERT INTO Children (value)
    VALUES (?)
  `;

  for (let i = 1; i < children.length; i++) {
    insertChildren = insertChildren.concat(`, (?)`);
  }

  insertChildren = insertChildren.concat(
    ` ON DUPLICATE KEY UPDATE value = VALUES(value)`
  );

  //  delete existing children
  pool.getConnection((err, connection) => {
    if (err) return cb(err);
    connection.query(deleteMapping, id, err => {
      if (err) return cb(err);
      if (children.length === 0) return cb();
      connection.query(insertChildren, children, err => {
        connection.release();
        if (err) return cb(err);
        loop(children);
      });
    });
  });

  // synchronously wait on each iteration for connection to release to prevent pool max limit reached error
  var i = 0;
  var loop = function(arr) {
    processChildren(arr[i], () => {
      i++;
      if (i < arr.length) {
        loop(arr);
      } else {
        cb(null);
      }
    });
  };

  function processChildren(child, callback) {
    pool.getConnection((err, connection) => {
      if (err) return cb(err);
      connection.query(findChild, [child], (err, res) => {
        if (err) return cb(err);
        connection.query(createMapping, [res[0].id, id], err => {
          connection.release();
          if (err) return cb(err);
          callback();
        });
      });
    });
  }
}

module.exports = {
  getTree,
  createFactory,
  deleteFactory,
  changeFactoryName,
  generateChildren
};
