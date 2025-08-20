function playScribbleSound() {
  const scribbleSound = new Audio("./scribble.mp3"); // Update the path if necessary
  scribbleSound.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}
// Class representing the game board of Tic-Tac-Toe
class GameBoard {
  constructor() {
    // The game board is initialized as an array with 9 empty strings (representing empty cells)
    this._gameBoard = ["", "", "", "", "", "", "", "", ""];
  }

  // Getter method to return the current state of the game board
  getGameBoard() {
    return this._gameBoard;
  }

  // Resets the game board to its initial empty state
  resetBoard() {
    this._gameBoard = ["", "", "", "", "", "", "", "", ""];
  }

  // Method to update a specific cell on the board
  updateCell(index, value) {
    // Only update the cell if it's empty and within valid range
    if (index >= 0 && index < 9 && this._gameBoard[index] === "") {
      this._gameBoard[index] = value;
      return true;
    }
    return false; // Return false if the cell can't be updated
  }
}

// Class responsible for updating the display (UI)
class DisplayController {
  constructor(gameBoard) {
    this.gameBoard = gameBoard;
    this.modal = document.querySelector(".modal"); // Modal for end game message
    this.endGameTxt = document.querySelector(".endgame-msg"); // Endgame message text
  }

  // Updates the game board display with the current game state
  updateGameBoard(gridCells, gameBoard) {
    gridCells.forEach((gridCell, index) => {
      gridCell.textContent = gameBoard[index];
      if (gameBoard[index] === "X") {
        gridCell.style.color = "#5dd028"; // Green for player X
      } else if (gameBoard[index] === "O") {
        gridCell.style.color = "#f45"; // Red for player O
      } else {
        gridCell.textContent = ""; // Clear the cell if it's empty
      }
    });
  }

  // Displays the end game modal with a message
  showEndScreen(endGameMsg) {
    this.endGameTxt.textContent = endGameMsg;
    this.modal.showModal();
  }

  // Closes the end game modal
  closeEndScreen() {
    this.modal.close();
  }
}

// Class representing a player in the game
class Player {
  constructor(signature) {
    this.signature = signature; // X or O to represent the player's mark
  }
}

// Bot class extending the Player class, representing the computer opponent
class Bot extends Player {
  constructor(signature) {
    super(signature); // Call the parent class (Player) constructor
  }

  makeMove(gameBoard) {
    const emptyCells = gameBoard.reduce((acc, cell, index) => {
      if (cell === "") acc.push(index); // Collect empty cell indices
      return acc;
    }, []);

    // Prioritize winning moves for the bot
    const winningMove = this.checkForWinningMove(gameBoard, this.signature);
    if (winningMove !== null) {
      return winningMove;
    }

    // If no winning move exists, block the opponent's winning move
    const blockingMove = this.checkForWinningMove(
      gameBoard,
      this.signature === "X" ? "O" : "X"
    );
    if (blockingMove !== null) {
      return blockingMove;
    }

    // If no immediate win or block, choose a center cell if available
    if (emptyCells.includes(4)) {
      return 4;
    }

    // Choose a corner cell if center is not available
    const cornerCells = [0, 2, 6, 8];
    const availableCorner = cornerCells.find((cell) =>
      emptyCells.includes(cell)
    );
    if (availableCorner !== undefined) {
      return availableCorner;
    }

    // Choose any remaining empty cell
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Checks if a specific move leads to a win for the given player
  checkForWinningMove(board, player) {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    // Check each pattern for a potential win
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] === player && board[b] === player && board[c] === "") {
        return c; // Return the empty cell index to win
      }
    }
    return null; // No winning move found
  }
}

// Main class controlling the game logic
class GameController {
  constructor(gameBoard, displayController, playerX, playerO, bot) {
    this.gridCells = document.querySelectorAll(".grid-cell"); // All the cells on the game board
    this.gameInfoTxt = document.getElementById("game-info-txt"); // Text for current player turn
    this.replayBtn = document.querySelector(".replay-game"); // Replay button
    this.modeSelectionDiv = document.getElementById("mode-selection"); // Mode selection buttons
    this.pvpBtn = document.getElementById("pvp-btn"); // PvP mode button
    this.pvbBtn = document.getElementById("pvb-btn"); // PvB mode button

    this.gameBoard = gameBoard; // Instance of the GameBoard
    this.displayController = displayController; // Instance of the DisplayController
    this.playerX = playerX; // Player X (human)
    this.playerO = playerO; // Player O (human or bot)
    this.bot = bot; // Bot player for PvB mode

    this.isPvPMode = true; // Game mode flag (true = PvP, false = PvB)
    this.isGameActive = false; // Flag to track if the game is currently active
    this.currentPlayer = this.playerX; // The current player, starts with Player X

    this.initializeEventListeners(); // Set up event listeners
    this.showModeSelection(); // Display mode selection screen at the start
  }

  // Initialize all the event listeners for buttons and game cells
  initializeEventListeners() {
    this.replayBtn.addEventListener("click", () => this.handleReplay()); // Replay button event
    this.pvpBtn.addEventListener("click", () => this.startGame(true)); // Start PvP mode
    this.pvbBtn.addEventListener("click", () => this.startGame(false)); // Start PvB mode

    // Add event listeners to all grid cells for making moves
    this.gridCells.forEach((cell, index) => {
      cell.addEventListener("click", () => this.handleCellClick(index));
    });
  }

  // Handles the replay button click: resets the game and shows mode selection
  handleReplay() {
    this.displayController.closeEndScreen(); // Close the end game screen
    this.showModeSelection(); // Show the mode selection screen
  }

  // Shows the mode selection screen and hides the game board
  showModeSelection() {
    this.modeSelectionDiv.style.display = "block"; // Show mode selection
    document.querySelector(".game-board").style.display = "none"; // Hide game board
    this.gameInfoTxt.style.display = "none"; // Hide game info text
    this.isGameActive = false; // Set game to inactive
  }

  // Starts a new game after a mode is selected
  startGame(isPvP) {
    this.resetGame(); // Reset the game board
    this.isPvPMode = isPvP; // Set the mode (PvP or PvB)
    this.isGameActive = true; // Activate the game
    this.modeSelectionDiv.style.display = "none"; // Hide mode selection
    document.querySelector(".game-board").style.display = "grid"; // Show the game board
    this.gameInfoTxt.style.display = "block"; // Show game info text
  }

  // Resets the game board and updates the display
  resetGame() {
    this.gameBoard.resetBoard(); // Reset the game board state
    this.displayController.updateGameBoard(
      this.gridCells,
      this.gameBoard.getGameBoard()
    ); // Update the board display
    this.currentPlayer = this.playerX; // Set Player X as the starting player
    this.isGameActive = true; // Set game as active
    this.updateGameInfo(); // Update the UI with the current player's turn
  }

  // Handles a cell click to make a move
  handleCellClick(index) {
    // Ignore clicks if the game isn't active or the cell is already filled
    if (!this.isGameActive || this.gameBoard.getGameBoard()[index] !== "") {
      return;
    }

    // Make the move for the current player
    this.makeMove(index);

    // If playing against the bot and it's now the bot's turn, make the bot's move
    if (!this.isPvPMode && this.currentPlayer === this.playerO) {
      this.makeBotMove();
    }
  }

  // Makes a move on the selected cell and checks for win/tie
  makeMove(index) {
    // Update the board and display if the move is valid
    if (this.gameBoard.updateCell(index, this.currentPlayer.signature)) {
      this.displayController.updateGameBoard(
        this.gridCells,
        this.gameBoard.getGameBoard()
      );

      playScribbleSound();

      // Check for win or tie conditions
      if (this.checkForWin()) {
        this.endGame(`Player ${this.currentPlayer.signature} wins!`);
      } else if (this.checkForTie()) {
        this.endGame("It's a tie!");
      } else {
        this.switchPlayer(); // Switch to the other player
        this.updateGameInfo(); // Update the UI with the new player's turn
      }
    }
  }

  // Bot makes its move
  makeBotMove() {
    setTimeout(() => {
      if (this.isGameActive) {
        const botMoveIndex = this.bot.makeMove(this.gameBoard.getGameBoard());
        this.makeMove(botMoveIndex); // Bot makes a random move
      }
    }, 500); // Add a slight delay to make the bot move feel more natural
  }

  // Switches to the other player
  switchPlayer() {
    this.currentPlayer =
      this.currentPlayer === this.playerX ? this.playerO : this.playerX;
  }

  // Updates the game info text to show the current player's turn
  updateGameInfo() {
    this.gameInfoTxt.textContent = `Player ${this.currentPlayer.signature}'s turn`;
  }

  // Checks if a player has won the game by matching any win pattern
  checkForWin() {
    const board = this.gameBoard.getGameBoard();
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    // Check each win pattern
    return winPatterns.some((pattern) => {
      const [a, b, c] = pattern;
      return board[a] && board[a] === board[b] && board[a] === board[c];
    });
  }

  // Checks if the game is a tie (all cells are filled with no winner)
  checkForTie() {
    return this.gameBoard.getGameBoard().every((cell) => cell !== "");
  }

  // Ends the game, showing the final result
  endGame(message) {
    this.isGameActive = false; // Stop the game
    this.displayController.showEndScreen(message); // Display the end game message
  }
}

// Initialize the game components
const gameBoard = new GameBoard();
const displayController = new DisplayController(gameBoard);
const playerX = new Player("X");
const playerO = new Player("O");
const bot = new Bot("O");

// Create a new GameController instance to start the game
new GameController(gameBoard, displayController, playerX, playerO, bot);
