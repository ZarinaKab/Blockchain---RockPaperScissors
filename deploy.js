const ethers = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
	// Provider and account setup
	const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
	const account = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

	// Load ABI and binary files
	const abi = fs.readFileSync("./Note_sol_RockPaperScissors.abi", "utf-8");
	const binary = fs.readFileSync("./Note_sol_RockPaperScissors.bin", "utf-8");

	// Create Contract Factory
	const contractFactory = new ethers.ContractFactory(abi, binary, account);
	
	// Deploy the contract
	console.log("Deploying...");
	const contract = await contractFactory.deploy(); // response

	console.log(contract);
	// const deploymentReceipt = await contract.waitForDeployment(1);
	// console.log(deploymentReceipt);
	// console.log(`Contract address: ${await contract.getAddress()}`);
	// let curNote = await contract.getNote();
	// console.log(`First request of note: ${curNote}`);

	// const txResponse = await contract.setNote("My first note");
	// const txReceipt = await txResponse.wait(1);
	// curNote = await contract.getNote();
	// console.log(`New note ${curNote}`);

	    // Wait for contract deployment
	const deploymentReceipt = await contract.deploymentTransaction().wait(1);
	console.log("Contract deployed successfully!");
	console.log(`Deployment Receipt:`, deploymentReceipt);
	console.log(`Contract Address: ${await contract.getAddress()}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});