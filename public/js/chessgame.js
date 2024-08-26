const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q"
  };

  const result = chess.move(move);

  if (result) {
    socket.emit("move", move); // Emit the move to the server if valid
    renderBoard(); // Re-render the board
  } else {
    // Handle invalid move (e.g., show an error message)
    console.error("Invalid move:", move);
  }
};

const getPieceUnicode = (piece) => {
  const unicodeMap = {
    "p": "♙", "r": "♖", "n": "♘", "b": "♗", "q": "♕", "k": "♔",
    "P": "♟", "R": "♜", "N": "♞", "B": "♝", "Q": "♛", "K": "♚",
  };

  return unicodeMap[piece.type] || "";
};

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();

        if (draggedPiece && sourceSquare) {
          const targetSquare = {
            row: parseInt(e.target.dataset.row),
            col: parseInt(e.target.dataset.col)
          };

          handleMove(sourceSquare, targetSquare); // Handle the move
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  playerRole = fen;
  renderBoard();
});

socket.on("move", (move) => {
  playerRole = move;
  renderBoard();
});

renderBoard();