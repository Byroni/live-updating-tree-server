require("newrelic");
require("dotenv").config();
const app = require("express")();
var server = require("http").Server(app);
const io = require("socket.io")(server);

const FactoryRepository = require("./DAL/FactoryRepository");
const { allowCors } = require("./middleware/helpers");

app.use(allowCors);

// get tree
app.get("/tree", (req, res) => {
  // redirect to status page
  res.send(tree);
});

// status enpoint
app.get("status", (req, res) => {
  res.send(tree);
});

io.on("connection", client => {
  //  Generate new child nodes based on range and size
  client.on("generateChildren", ({ id, numNodes, lowerBound, upperBound }) => {
    var children = Array.from({ length: numNodes }, () => {
      return (
        Math.floor(Math.random() * (upperBound - lowerBound + 1)) +
        parseInt(lowerBound)
      );
    });

    FactoryRepository.generateChildren(id, children, err => {
      if (err != null) return client.emit("onError", err);
      emitUpdatedTree();
    });
  });

  //  Get the tree
  client.on("getTree", () => {
    FactoryRepository.getTree((res, err) => {
      if (err != null) client.emit("onError", err);
      client.emit("getTree", res);
    });
  });

  //  Change the factory name
  client.on("changeFactoryName", ({ id, name }) => {
    FactoryRepository.changeFactoryName(id, name, err => {
      if (err != null) return client.emit("onError", err);
      emitUpdatedTree();
    });
  });

  //  Create a new empty factory
  client.on("createFactory", () => {
    FactoryRepository.createFactory("factory", err => {
      if (err != null) return client.emit("onError", err);
      emitUpdatedTree();
    });
  });

  // Delete a factory on id
  client.on("deleteFactory", ({ id }) => {
    FactoryRepository.deleteFactory(id, err => {
      if (err != null) return client.emit("onError", err);
      emitUpdatedTree();
    });
  });
});

function emitUpdatedTree() {
  FactoryRepository.getTree((res, err) => {
    if (err != null) return client.emit("onError", err);
    io.sockets.emit("getTree", res);
  });
}

server.listen(process.env.PORT);
