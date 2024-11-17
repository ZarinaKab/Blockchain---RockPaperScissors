let contract;
let signer;
const betAmount = ethers.utils.parseEther('0.0001', 'ether'); // 0.0001 tBNB = 100,000,000,000,000 wei
const contractAddress = "0x1121405C1A153822e3C765b7f99e698Fb6285c97";  // Replace with your contract address
const options = {value: betAmount, gasLimit: 200000}
const contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"betAmount","type":"uint256"},{"indexed":false,"internalType":"enum RockPaperScissors.Choice","name":"playerChoice","type":"uint8"},{"indexed":false,"internalType":"enum RockPaperScissors.Choice","name":"houseChoice","type":"uint8"},{"indexed":false,"internalType":"bool","name":"playerWon","type":"bool"},{"indexed":false,"internalType":"string","name":"message","type":"string"}],"name":"GameResult","type":"event"},{"inputs":[],"name":"BET_AMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"depositFunds","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"enum RockPaperScissors.Choice","name":"_playerChoice","type":"uint8"}],"name":"play","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawFunds","outputs":[],"stateMutability":"nonpayable","type":"function"}]

async function connectToMetaMask() {
    provider = new ethers.providers.Web3Provider(window.ethereum, 97);
    try {
        await provider.send("eth_requestAccounts", []).then(() => {
            provider.listAccounts().then((accounts) => {
                signer = provider.getSigner(accounts[0]);
                contract = new ethers.Contract(contractAddress, contractABI, signer);
                console.log(contract);
            });
        });
    } catch (error) {
        console.error("User rejected the request or error occurred");
    }
}

connectToMetaMask()

function getChoiceName(choice) {
    if (choice == 0) return "Rock";
    if (choice == 1) return "Paper";
    if (choice == 2) return "Scissors";
    return "Unknown";
}

async function updateContractBalanceHistory() {
    try{
        const balance = await contract.getBalance();
        document.getElementById("contractBalance").textContent = ethers.utils.formatEther(balance); 

        // get game results from last 10000 blocks
        const latestBlock = await provider.getBlockNumber();
        const filter = contract.filters.GameResult(null, null, null, null);
        const data = await contract.queryFilter(filter, latestBlock - 100, latestBlock); // уменьшите диапазон
        console.log(data)
        
        stre = "<ol>"; // Clear history
        for (let i = 0; i < data.length; i++){
            res = data[data.length-1-i].args;//reverse order
            stre += `
                <li>
                    <h4>Player: ${res.player}</h4>
                    <h4>Bet: ${ethers.utils.formatEther(res.betAmount)} ETH</h4>
                    <h4>Player Choice: ${getChoiceName(res.playerChoice)}<h4>
                    <h4>House Choice: ${getChoiceName(res.houseChoice)}<h4>
                    <h4>Result: ${res.message}<h4>
                </li>`;
        }
        const historyElement = document.getElementById("history");
        historyElement.innerHTML = stre + "</ol>";
    } catch (error) {
        console.error(error);
    }
}

async function depositFunds() {
    try {
        res = await contract.depositFunds(options);
    } catch (error) {
        console.error("Error depositing funds:", error);
        document.getElementById("resultMessage").textContent = "Error depositing funds. Please try again.";
    }
}

async function withdrawFunds() {
    try {
        const withdrawMessage = document.getElementById("withdrawMessage");
        const amountInput = document.getElementById("withdrawAmount").value;

        // Validate input
        if (!amountInput || isNaN(amountInput) || Number(amountInput) <= 0) {
            withdrawMessage.textContent = "Enter a valid amount in ETH.";
            return;
        }

        const amountInWei = ethers.utils.parseEther(amountInput); // Convert ETH to Wei

        // Check connected account
        const ownerAddress = await contract.owner();
        const userAddress = await signer.getAddress();

        if (userAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
            withdrawMessage.textContent = "Only the contract owner can withdraw funds.";
            return;
        }

        withdrawMessage.textContent = "Processing withdrawal...";

        // Call the contract's withdrawFunds function
        const tx = await contract.withdrawFunds(amountInWei, { gasLimit: 100000 });
        await tx.wait(); // Wait for transaction confirmation

        withdrawMessage.textContent = "Withdrawal successful!";
        // Update contract balance
        await updateContractBalanceHistory();
    } catch (error) {
        console.error("Error withdrawing funds:", error);

        const withdrawMessage = document.getElementById("withdrawMessage");
        if (error.data && error.data.message) {
            withdrawMessage.textContent = `Error: ${error.data.message}`;
        } else {
            withdrawMessage.textContent = "Error withdrawing funds. Please try again.";
        }
    }
}


async function playGame(playerChoice) {
    const playerBalance = await provider.getBalance(await signer.getAddress());

    // // Checking if the player has enough balance
    if (playerBalance < betAmount) {
        alert("You do not have enough funds to play. Please top up your account.");
        return;
    }
    try {
        const resultMessage = document.getElementById("resultMessage");

        contract.play(playerChoice, options);
        document.getElementById("resultMessage").textContent = "Transaction has been sent.";
        contract.on("GameResult", (from, pc, hc, won)=>{
            console.log(`${from} choised ${pc}, house choiced ${hc}, player won: ${won}`)
        });
        contract.on("GameResult", (a, b, c, d, e, msg)=>{
            console.log(`Game result: ${msg}`)
            document.getElementById("resultMessage").textContent = msg;
            updateContractBalanceHistory();
        });
    } catch (error) {
        console.error("Error playing game:", error);
        document.getElementById("resultMessage").textContent = "Error playing the game. Please try again.";
    }
}

// Event listeners for game buttons
document.getElementById("rock").addEventListener("click", () => playGame(0));  // Rock = 0
document.getElementById("paper").addEventListener("click", () => playGame(1)); // Paper = 1
document.getElementById("scissors").addEventListener("click", () => playGame(2)); // Scissors = 2

// Connect MetaMask when button is clicked
document.getElementById("connectBtn").addEventListener("click", connectToMetaMask);
document.getElementById("depositBtn").addEventListener("click", depositFunds);
document.getElementById("checkBalanceHistoryBtn").addEventListener("click", updateContractBalanceHistory);

// Add event listener to the Withdraw button
document.getElementById("withdrawBtn").addEventListener("click", withdrawFunds);