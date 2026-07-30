const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MineToken (MCT)
    const MineToken = await hre.ethers.getContractFactory("MineToken");
    const mineToken = await MineToken.deploy();
    await mineToken.waitForDeployment();
    const mineTokenAddress = await mineToken.getAddress();
    console.log("MineToken (MCT) deployed to:", mineTokenAddress);

    // 2. Deploy RareVideoNFT (MCRV)
    const RareVideoNFT = await hre.ethers.getContractFactory("RareVideoNFT");
    const rareVideoNFT = await RareVideoNFT.deploy();
    await rareVideoNFT.waitForDeployment();
    const rareVideoNFTAddress = await rareVideoNFT.getAddress();
    console.log("RareVideoNFT deployed to:", rareVideoNFTAddress);

    // 3. Deploy Treasury
    const signerAddress = deployer.address; // Use deployer as the initial backend signer
    const Treasury = await hre.ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(mineTokenAddress, signerAddress);
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    console.log("Treasury deployed to:", treasuryAddress);

    // 4. Transfer initial MCT tokens to Treasury
    const amountToTreasury = hre.ethers.parseUnits("500000", 18); // 500,000 MCT
    const tx = await mineToken.transfer(treasuryAddress, amountToTreasury);
    await tx.wait();
    console.log("Transferred 500,000 MCT to Treasury");

    // 5. Save frontend files (ABI & Address)
    // We'll output this to a JSON file in the frontend for easy consumption
    const fs = require("fs");
    const frontendDir = __dirname + "/../../minecast-frontend/utils/contracts";

    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    const contractsConfig = {
        mineTokenAddress,
        rareVideoNFTAddress,
        treasuryAddress,
        networkId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    };

    fs.writeFileSync(
        frontendDir + "/addresses.json",
        JSON.stringify(contractsConfig, null, 2)
    );

    // Save ABIs
    const mineTokenArtifact = artifacts.readArtifactSync("MineToken");
    const rareVideoNFTArtifact = artifacts.readArtifactSync("RareVideoNFT");
    const treasuryArtifact = artifacts.readArtifactSync("Treasury");

    fs.writeFileSync(
        frontendDir + "/MineToken.json",
        JSON.stringify(mineTokenArtifact, null, 2)
    );
    fs.writeFileSync(
        frontendDir + "/RareVideoNFT.json",
        JSON.stringify(rareVideoNFTArtifact, null, 2)
    );
    fs.writeFileSync(
        frontendDir + "/Treasury.json",
        JSON.stringify(treasuryArtifact, null, 2)
    );

    console.log("Frontend config saved to:", frontendDir);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
