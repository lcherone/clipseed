//
const express = require("express");
const compression = require("compression");
const path = require("path");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

//
const port = 8080;
const publicDir = path.join(__dirname, "..", "app/dist");

//
let peers = {};
let videos = {};

//
app.set("json spaces", 2);
app.use(compression());

//
app.use("/", express.static(publicDir));

//
app.get("/debug", (req, res) => {
  res.json({
    peers,
    videos
  });
});

// history api fallback
app.use(
  "/",
  ((...args) => (req, res, next) => {
    if (
      (req.method === "GET" || req.method === "HEAD") &&
      req.accepts("html")
    ) {
      (res.sendFile || res.sendfile).call(res, ...args, err => err && next());
    } else next();
  })("index.html", {
    root: publicDir
  })
);

// pre connection middleware
io.use((socket, next) => {
  let token = socket.handshake.query.token || "";

  try {
    if (token !== "guest") {
      return next(new Error("invalid token"));
    }

    //
    peers[socket.id] = {
      id: socket.id,
      profile: {
        name: ""
      },
      videos: []
    };

    return next();
  } catch (e) {
    return next(e);
  }
});

/**
 *
 */
io.on("connection", function(socket) {
  console.log("Peer connected! [Total peers %d]", Object.values(peers).length);

  socket.on("disconnect", function() {
    console.log(
      "Peer disconnected! [Total peers %d]",
      Object.values(peers).length - 1
    );

    // handle video peers or delete
    for (let i in peers[socket.id].videos) {
      let infoHash = peers[socket.id].videos[i];
      if (videos[infoHash]) {
        // decrease peers
        videos[infoHash].peers--;

        // remove if no peers
        if (!videos[infoHash].peers || videos[infoHash].peers < 1) {
          delete videos[infoHash];
        }
      }
    }

    delete peers[socket.id];

    // tell other peers
    socket.broadcast.emit("peer:left", {
      id: socket.id
    });
  });

  // client announce, after connect to populate meta like profile (which is stored clientside)
  socket.on("announce", function(peer, cb) {
    try {
      if (socket.id === peer.id) {
        // set profile
        if (peer.profile) {
          peers[socket.id].profile.name = peer.profile.name;
        }

        if (typeof cb === "function")
          cb({
            id: socket.id
          });

        // tell other peers
        socket.broadcast.emit("peer:joined", {
          id: socket.id
        });
      } else {
        if (typeof cb === "function") cb(false);
      }
    } catch (e) {
      if (typeof cb === "function") cb(e.message);
    }
  });

  /*
    data looks like:
    {
        id: 'socket.id'
        video: {
            "name": "video.mp4",
            "size": 4198316,
            "duration": 10.443771,
            "hash": "f98afef9d654743b01ebd8893569914d03f49dbb",
            "screens": [
                "8c3d44aa591624e1396710f8a976042f594822bd",
                "98ae51a0b0a43258ad3543cae471214617ff5c12",
                "0605159828582eaef588d5634c115173b691b515",
                "5755eb285fe4dbaef7df12e05256caaaeec18f30",
                "3878b8a02b05987cba2aa7b14dab67d5d9c483e5",
                "9d12001056f7618355ee1583c7375a030d76b187",
                "eb1cc6984697b12510531e5f43348198761dfdd0",
                "4a1a7ce51d405763b6e173e20c711437637b0dd9",
                "9a6acfb2fb1dab2320194498942d044108471e5a"
            ]
        }
    }
    */
  socket.on("video:add", function(data, cb) {
    try {
      if (socket.id === data.id) {
        //
        if (!data.video.hash || data.video.hash.length !== 40) {
          if (typeof cb === "function") cb(false);
          return;
        }

        // add video to peer
        peers[socket.id].videos.push(data.video.hash);

        // add video
        videos[data.video.hash] = {};
        videos[data.video.hash].name = data.video.name || "";
        videos[data.video.hash].size = data.video.size || 0;
        videos[data.video.hash].duration = data.video.duration || 0;
        videos[data.video.hash].hash = data.video.hash;

        // "screen" screens
        videos[data.video.hash].screens = [];
        for (let i in data.video.screens) {
          if (data.video.screens[i].length === 40)
            videos[data.video.hash].screens.push(data.video.screens[i]);
        }

        // workout how many peers
        videos[data.video.hash].peers = 0;
        for (let i in peers) {
          if (peers[i].videos && peers[i].videos.includes(data.video.hash)) {
            videos[data.video.hash].peers++;
          }
        }
        if (typeof cb === "function") cb(true);
      } else {
        if (typeof cb === "function") cb(false);
      }
    } catch (e) {
      if (typeof cb === "function") cb(e.message);
    }
  });

  socket.on("videos:get", function(data, cb) {
    if (socket.id === data.id) {
      if (typeof cb === "function") cb(Object.values(videos));
    } else {
      if (typeof cb === "function") cb(false);
    }
  });

  socket.on("video:get", function(data, cb) {
    if (socket.id === data.id && data.video) {
      if (typeof cb === "function") cb(videos[data.video.hash]);
    } else {
      if (typeof cb === "function") cb(false);
    }
  });

  socket.on("video:downloaded", function(data, cb) {
    if (socket.id === data.id) {
      //
      peers[socket.id].videos.push(data.video.hash);

      //
      if (videos[data.video.hash]) {
        videos[data.video.hash].peers++;
      }
      if (typeof cb === "function") cb(true);
    } else {
      if (typeof cb === "function") cb(false);
    }
  });

  socket.on("peers:get", function(data, cb) {
    try {
      if (socket.id === data.id) {
        if (typeof cb === "function") cb(peers);
      } else {
        if (typeof cb === "function") cb(false);
      }
    } catch (e) {
      if (typeof cb === "function") cb(e.message);
    }
  });
});

server.listen(port, () =>
  console.log(`Server started: http://localhost:${port}`)
);
