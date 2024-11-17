// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract RockPaperScissors {
    address public owner;
    uint public constant BET_AMOUNT = 100000000000000; // wei 10^14
    event GameResult(address indexed player, uint betAmount, Choice playerChoice, Choice houseChoice, bool playerWon, string message);

    enum Choice { Rock, Paper, Scissors } // Enum to represent player choices

    // Структура для хранения информации о каждой игре
    struct GameHistory {
        address player;
        uint betAmount;
        Choice playerChoice;
        Choice houseChoice;
        bool playerWon;
        string resultMessage;
    }

    // Массив для хранения истории игр
    GameHistory[] public gameHistory;

    constructor() {
        owner = msg.sender;
    }

    function depositFunds() external payable {
        require(msg.value >= BET_AMOUNT, "Deposit amount must be greater than or equal to 100000000000000 wei");
    }

    function play(Choice _playerChoice) external payable {
        require(msg.value == BET_AMOUNT, "You need 0.0001 tBNB which equals 100000000000000 wei to play");
        Choice houseChoice = getHouseChoice();
        (bool playerWon, string memory resultMessage) = determineWinner(_playerChoice, houseChoice);

        // Сохраняем информацию об игре в истории
        gameHistory.push(GameHistory({
            player: msg.sender,
            betAmount: BET_AMOUNT,
            playerChoice: _playerChoice,
            houseChoice: houseChoice,
            playerWon: playerWon,
            resultMessage: resultMessage
        }));

        // Если игрок выигрывает, передаем ему выигрыш
        if (playerWon == false) {
            payable(msg.sender).transfer(BET_AMOUNT * 2);
        }

        // Эмитируем событие
        emit GameResult(msg.sender, BET_AMOUNT, _playerChoice, houseChoice, playerWon, resultMessage);
    }

    // Внутренняя функция для генерации выбора дома случайным образом
    function getHouseChoice() internal view returns (Choice) {
        uint random = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, block.number)));
        return Choice(random % 3); // 0 = Rock, 1 = Paper, 2 = Scissors
    }

    // Функция для определения победителя
    function determineWinner(Choice playerChoice, Choice houseChoice) internal pure returns (bool, string memory) {
        if (playerChoice == houseChoice) {
            return (false, "It's a draw");
        } else if (
            (playerChoice == Choice.Rock && houseChoice == Choice.Scissors) ||
            (playerChoice == Choice.Scissors && houseChoice == Choice.Paper) ||
            (playerChoice == Choice.Paper && houseChoice == Choice.Rock)
        ) {
            return (true, "Player Win!");
        }
        return (false, "Player loses ;)");
    }

    // Функция для вывода средств владельцем контракта
    function withdrawFunds(uint amount) external {
        require(msg.sender == owner, "Only the owner can withdraw funds");
        require(amount <= address(this).balance, "Withdrawal amount exceeds balance");
        payable(owner).transfer(amount);
    }

    // Функция для получения баланса контракта
    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    // Функция для получения истории игр
    function getGameHistory(uint startIndex, uint endIndex) external view returns (GameHistory[] memory) {
        require(endIndex >= startIndex, "Invalid index range");
        uint count = endIndex - startIndex + 1;
        GameHistory[] memory history = new GameHistory[](count);
        for (uint i = 0; i < count; i++) {
            history[i] = gameHistory[startIndex + i];
        }
        return history;
    }

    // Функция для получения общего количества игр
    function getTotalGames() external view returns (uint) {
        return gameHistory.length;
    }
}
