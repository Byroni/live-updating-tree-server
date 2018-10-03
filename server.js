const app = require("express")();
var server = require("http").Server(app);
const io = require("socket.io")(server);
const FactoryRepository = require("./DAL/FactoryRepository");
require("dotenv").config();

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
    var children = Array.from({ length: numNodes }, () =>
      Math.floor(Math.random() * (upperBound - lowerBound) + lowerBound)
    );
    io.sockets.emit("generateChildren", id, children);
  });

  //  Get the tree
  client.on("getTree", () => {
    try {
      FactoryRepository.getTree(res => {
        client.emit("getTree", res);
      });
    } catch (e) {
      console.log(e);
    }
  });

  //  Change the factory name
  client.on("changeFactoryName", ({ name }) => {
    tree.root[id].name = name; // TODO: find by id, not index. Will be fixed with database replacement

    io.sockets.emit("changeFactoryName", id, tree.root[id]);
  });

  //  Create a new empty factory
  client.on("createFactory", () => {
    FactoryRepository.createFactory("factory", () => {
      FactoryRepository.getTree(res => {
        io.sockets.emit("getTree", res);
      });
    });
  });

  // Delete a factory on id
  client.on("deleteFactory", ({ id }) => {
    FactoryRepository.deleteFactory(id, () => {
      FactoryRepository.getTree(res => {
        io.sockets.emit("getTree", res);
      });
    });
  });
});

server.listen(process.env.PORT);

// mock data
var tree = {
  root: [
    {
      id: 0,
      name: "factory",
      children: [332, 12, 6, 7, 2, 9, 332, 12, 6, 7, 2, 9, 13, 14, 18]
    },
    {
      id: 1,
      name: "factory",
      children: [9, 32]
    }
  ]
};
