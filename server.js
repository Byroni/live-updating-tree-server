const app = require("express")();
var server = require("http").Server(app);
const io = require("socket.io")(server);
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
    console.log(id, numNodes, lowerBound, upperBound, children);
    io.sockets.emit("generateChildren", id, children);
  });

  //  Get the tree
  client.on("getTree", () => {
    client.emit("getTree", tree);
  });

  //  Change the factory name
  client.on("changeFactoryName", ({ id, name }) => {
    tree.root[id].name = name; // TODO: find by id, not index. Will be fixed with database replacement

    io.sockets.emit("changeFactoryName", id, tree.root[id]);
  });

  //  Create a new empty factory
  client.on("createFactory", () => {
    tree.root.push({
      id: tree.root.length,
      name: "Factory",
      children: []
    });

    io.sockets.emit("getTree", tree);
  });

  // Delete a factory on id
  client.on("deleteFactory", ({ id }) => {
    // TODO: replace with database removal
    var newTreeRoot = tree.root.filter(factory => {
      return factory.id != id;
    });

    tree.root = newTreeRoot;

    io.sockets.emit("getTree", tree);
  });
});

server.listen(process.env.PORT);

console.log(process.env.PORT);

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
