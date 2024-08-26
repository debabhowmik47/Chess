const express = require('express');
const app = express();
const path = require('path');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require("chess.js");

const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();
let players = [];
let currentPlayer = 'W';

// Set the port to either an environment variable or default to 3000
const PORT = process.env.PORT || 3000;

app.set('view engine', "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.render('index', { title: "Custom Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("connected");
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "W");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "B");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === "W" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "B" && uniquesocket.id !== players.black) return;
            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid Move:", move);
                uniquesocket.emit("Invalid Move:", move);
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("Invalid Move:", move);
        }
    });
});

// Start the server and handle potential EADDRINUSE errors
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', function (err) {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        throw err;
    }
});
