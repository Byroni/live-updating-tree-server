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
  let findExistingChild = `
    SELECT
      id
    FROM
      Children
    WHERE
      value = ?
  `;

  let insertChild = `
    INSERT INTO Children (value)
    VALUES (?)
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

  //  delete existing children
  pool.getConnection((err, connection) => {
    if (err) return cb(err);
    connection.query(deleteMapping, id, err => {
      connection.release();
      if (err) return cb(err);
      //  loop through each child and process
      loop(children);
    });
  });

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
      connection.query(findExistingChild, [child], (err, res) => {
        if (err) return cb(err);
        if (res.length === 0) {
          //  if we couldn't find the child value
          //  insert and create mapping
          connection.query(insertChild, [child], (err, res) => {
            if (err) return cb(err);
            connection.query(createMapping, [res.insertId, id], err => {
              connection.release();
              if (err) return cb(err);
              callback();
            });
          });
        } else {
          //  use existing child to create mapping
          connection.query(createMapping, [res[0].id, id], err => {
            connection.release();
            if (err) return cb(err);
            callback();
          });
        }
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
