window.onload = function () {
  var rollButton = document.getElementById("rollButton");
  rollButton.onclick = Game.takeTurn;

  //initialize board
  Game.populateBoard();
};

//IIFE function to create game board object
var Game = (function () {
  // A game object to hold the game board squares, methods, players
  var game = {};

  //an Array to hold players data

  game.squares = [];
  var boardData = [];
  var sqr = 2;

  //fetching data from json file

  fetch("./board.json")
    .then((response) => {
      return response.json();
    })
    .then(function (jasondata) {
      boardData = jasondata.slice(1);
      // console.log(boardData);

      const squares = boardData.map(
        (data) => new Square(data.name, data.price, data.colour, data.type)
      );

      game.squares = squares;
      console.log(game.squares);
    });

  //Array of players

  game.players = [
    new Player("Peter", 16, "Triangle", "player1"),
    new Player("Billy", 16, "Circle", "player2"),
    new Player("Charlotte", 16, "Triangle2", "player3"),
    new Player("Swedall", 16, "Circle2", "player4"),
  ];

  //set current player(Initially player 1).

  game.currentPlayer = 0;

  //A method Allow to add the squares to the game board

  game.populateBoard = function () {
    for (var i = 0; i < this.squares.length; i++) {
      //get square ID from object and then find its div
      var id = this.squares[i].squareID;

      var squareName = document.getElementById(id + "-name");
      var squareValue = document.getElementById(id + "-value");
      var squareOwner = document.getElementById(id + "-owner");
      var squareColour = document.getElementById(id + "-colour");

      squareName.innerHTML = this.squares[i].name;
      squareValue.innerHTML = "$" + this.squares[i].value;
      squareColour.innerHTML = this.squares[i].colour;
      squareOwner.innerHTML = this.squares[i].owner;
    }

    //Setting start square and add all players

    var square1 = document.getElementById("square1-residents");
    for (var i = 0; i < game.players.length; i++) {
      //using private function to create tokens
      game.players[i].createToken(square1);
    }

    //A simple private function to render the info panel

    updateByID("player1-info_name", game.players[0].name);
    updateByID("player1-info_cash", game.players[0].cash);
    updateByID("player2-info_name", game.players[1].name);
    updateByID("player2-info_cash", game.players[1].cash);
    updateByID("player3-info_name", game.players[2].name);
    updateByID("player3-info_cash", game.players[2].cash);
    updateByID("player4-info_name", game.players[3].name);
    updateByID("player4-info_cash", game.players[3].cash);
  };

  //fetching the rolls from json file

  fetch("./rolls_1.json") //you can also use rolls_2.jsone file
    .then((response) => {
      return response.json();
    })
    .then(function (jasondata) {
      game.rolls = jasondata;
    });

  //A function to take turn, allow purchse and take rent.

  game.takeTurn = function () {
    movePlayer();

    checkTile();

    //Declare the winner
    //if current player drops below $0, declare winner who has highest money
    if (game.players[game.currentPlayer].cash <= 0) {
      var st = [];
      for (var i = 0; i < game.players.length; i++) {
        st.push(game.players[i].cash);
      }
      console.log(st);
      var maxValue = Math.max(...st); //find the maximum value of cash

      var maxId = st.indexOf(maxValue); //find player id with maximum cash

      alert(
        "Congratulations!!!....The Winner is " +
          game.players[maxId].name +
          "..."
      );
    }

    //move to next player
    game.currentPlayer = nextPlayer(game.currentPlayer);

    //update info of player

    updateByID("currentTurn", game.players[game.currentPlayer].name);
  };

  /************functions***************/
  //function for moving to the next player

  function nextPlayer(currentPlayer) {
    var nextPlayer = currentPlayer + 1;

    if (nextPlayer == game.players.length) {
      return 0;
    }

    return nextPlayer;
  }

  //function to move player

  function movePlayer() {
    // taking each roll from rolls

    var moves = game.rolls.shift();

    var totalSquares = game.squares.length + 1;

    var currentPlayer = game.players[game.currentPlayer];

    var currentSquare = parseInt(currentPlayer.currentSquare.slice(6));

    //Add $1 when player pass the satrt

    if (currentSquare + moves <= totalSquares) {
      var nextSquare = currentSquare + moves;
    } else {
      var nextSquare = currentSquare + moves - totalSquares;
      currentPlayer.updateCash(currentPlayer.cash + 1);
      console.log("$1 for passing start");
    }

    currentPlayer.currentSquare = "square" + nextSquare;

    var currentToken = document.getElementById(currentPlayer.id);
    currentToken.parentNode.removeChild(currentToken);

    //add player to next location

    currentPlayer.createToken(
      document.getElementById(currentPlayer.currentSquare)
    );
  }
  let clrAndPlayer = [];

  //function that move the player pay rent to owner and buy property

  function checkTile() {
    var currentPlayer = game.players[game.currentPlayer];
    var currentSquareId = currentPlayer.currentSquare;
    var currentSquareObj = game.squares.filter(function (square) {
      return square.squareID == currentSquareId;
    })[0];

    //check if the player landed on start

    if (currentSquareId == "square1") {
      updateByID("messagePara", currentPlayer.name + ": You landed on start.");
    } else if (currentSquareObj.owner == "For Sale") {
      //If the property is unowned, allow to buy:
      //check if owner can pay for property
      if (currentPlayer.cash <= currentSquareObj.value) {
        updateByID(
          "messagePara",
          currentPlayer.name +
            ": Sorry, you dont have enough money to buy this property"
        );
        return;
      }

      var purchase = true;

      //Allow purchase a property to the player
      if (purchase) {
        //update owner of current square

        currentSquareObj.owner = currentPlayer.id;
        //update cash of the player

        currentPlayer.updateCash(currentPlayer.cash - currentSquareObj.value);

        //display a message to the game board

        updateByID(
          "messagePara",
          currentPlayer.name + ": you now have $" + currentPlayer.cash
        );

        //Display the owner on the board

        updateByID(
          currentSquareObj.squareID + "-owner",
          "Owner: " + game.players[game.currentPlayer].name
        );

        //double the rent if owner owns the same colour property

        var colour = currentSquareObj.colour;
        var owner = currentSquareObj.owner;
        var combination = colour + owner;
        console.log(combination);

        if (clrAndPlayer.includes(combination)) {
          var filteredData = game.squares.filter(
            (square) => square.colour == colour
          );
          console.log(filteredData);
          filteredData.map((data) =>
            updateByID(data.squareID + "-value", "$ " + data.rent * 2)
          );
          filteredData.map((data) => (data.rent = data.rent * 2));
        } else {
          clrAndPlayer.push(combination);
        }
      }
    } else if (currentSquareObj.owner == currentPlayer.id) {
      updateByID(
        "messagePara",
        currentPlayer.name + ": You own this property."
      );
    } else {
      //charge rent
      updateByID(
        "messagePara",
        currentPlayer.name +
          ": This property is owned by " +
          currentSquareObj.owner +
          ". You have to pay $" +
          currentSquareObj.rent
      );

      var owner = game.players.filter(function (player) {
        return player.id == currentSquareObj.owner;
      });

      currentPlayer.updateCash(currentPlayer.cash - currentSquareObj.rent);
    }
  }

  //function to update HTML code by element ID

  function updateByID(id, msg) {
    document.getElementById(id).innerHTML = msg;
  }

  /****Constructor functions*****/

  //constructor function for setting properties square

  function Square(name, price, colour, type) {
    this.name = name;
    this.value = price;
    this.rent = price;
    this.squareID = "square" + sqr++;
    this.colour = colour;
    this.owner = "For Sale";
  }

  //constructor function for players

  function Player(name, cash, token, id) {
    this.name = name;
    this.cash = cash;
    this.token = token;
    this.id = id;
    this.currentSquare = "square1";
    this.ownedSquares = [];
  }

  //Add a method to display plsyers on game board
  //Adding it as a prototype of the Player constructor function
  Player.prototype.createToken = function (square) {
    var playerSpan = document.createElement("span");
    playerSpan.setAttribute("class", this.token);
    playerSpan.setAttribute("id", this.id);
    square.appendChild(playerSpan);
  };

  //method forupdate the amount of cash of a player

  Player.prototype.updateCash = function (amount) {
    document.getElementById(this.id + "-info_cash").innerHTML = amount;
    this.cash = amount;
  };

  return game;
})();
