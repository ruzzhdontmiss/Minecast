const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MineCast Contracts", function () {
    let mineToken, rareVideoNFT, treasury;
    let owner, signer, user, otherAccount;

    beforeEach(async function () {
        [owner, signer, user, otherAccount] = await ethers.getSigners();

        // Deploy MineToken
        const MineToken = await ethers.getContractFactory("MineToken");
        mineToken = await MineToken.deploy();

        // Deploy RareVideoNFT
        const RareVideoNFT = await ethers.getContractFactory("RareVideoNFT");
        rareVideoNFT = await RareVideoNFT.deploy();

        // Deploy Treasury
        const Treasury = await ethers.getContractFactory("Treasury");
        treasury = await Treasury.deploy(await mineToken.getAddress(), signer.address);

        // Mint initial supply of MCT to the Treasury so it can distribute rewards
        await mineToken.mint(await treasury.getAddress(), ethers.parseUnits("500000", 18));
    });

    describe("MineToken", function () {
        it("Should assign the deployer the initial supply", async function () {
            const initialSupply = ethers.parseUnits("1000000", 18);
            expect(await mineToken.balanceOf(owner.address)).to.equal(initialSupply);
        });

        it("Should let owner mint more tokens", async function () {
            await mineToken.mint(user.address, ethers.parseUnits("100", 18));
            expect(await mineToken.balanceOf(user.address)).to.equal(ethers.parseUnits("100", 18));
        });
    });

    describe("RareVideoNFT", function () {
        it("Should allow owner to mint on behalf of user", async function () {
            const tx = await rareVideoNFT.mintVideo(user.address, "ipfs://test-uri", 95);
            await tx.wait();

            expect(await rareVideoNFT.ownerOf(0)).to.equal(user.address);
            expect(await rareVideoNFT.tokenURI(0)).to.equal("ipfs://test-uri");
        });

        it("Should allow user to mint to themselves directly", async function () {
            const tx = await rareVideoNFT.connect(user).mintVideo(user.address, "ipfs://user-clip", 88);
            await tx.wait();

            expect(await rareVideoNFT.ownerOf(0)).to.equal(user.address);
            expect(await rareVideoNFT.tokenURI(0)).to.equal("ipfs://user-clip");
        });

        it("Should prevent user from minting to another address", async function () {
            await expect(
                rareVideoNFT.connect(user).mintVideo(otherAccount.address, "ipfs://fake", 50)
            ).to.be.revertedWith("Unauthorized minter");
        });
    });

    describe("Treasury", function () {
        it("Should allow a user to claim rewards with a valid signature", async function () {
            const rewardAmount = ethers.parseUnits("10", 18);
            const nonce = 1;
            const treasuryAddress = await treasury.getAddress();

            // Hash the message in the same way the contract does
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "uint256", "uint256", "address"],
                [user.address, rewardAmount, nonce, treasuryAddress]
            );

            // Sign the hashed message
            const signature = await signer.signMessage(ethers.getBytes(messageHash));

            // Claim the reward as the user
            await expect(treasury.connect(user).claimReward(rewardAmount, nonce, signature))
                .to.emit(treasury, "RewardClaimed")
                .withArgs(user.address, rewardAmount, nonce);

            expect(await mineToken.balanceOf(user.address)).to.equal(rewardAmount);
            expect(await treasury.usedNonces(nonce)).to.equal(true);
        });

        it("Should reject claim with invalid signature", async function () {
            const rewardAmount = ethers.parseUnits("10", 18);
            const nonce = 2;
            const treasuryAddress = await treasury.getAddress();

            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "uint256", "uint256", "address"],
                [user.address, rewardAmount, nonce, treasuryAddress]
            );

            // Using the wrong signer!
            const signature = await otherAccount.signMessage(ethers.getBytes(messageHash));

            await expect(treasury.connect(user).claimReward(rewardAmount, nonce, signature))
                .to.be.revertedWith("Invalid signature");
        });

        it("Should reject reusing the same nonce", async function () {
            const rewardAmount = ethers.parseUnits("10", 18);
            const nonce = 3;
            const treasuryAddress = await treasury.getAddress();

            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "uint256", "uint256", "address"],
                [user.address, rewardAmount, nonce, treasuryAddress]
            );

            const signature = await signer.signMessage(ethers.getBytes(messageHash));

            // First claim should succeed
            await treasury.connect(user).claimReward(rewardAmount, nonce, signature);

            // Second claim should fail
            await expect(treasury.connect(user).claimReward(rewardAmount, nonce, signature))
                .to.be.revertedWith("Nonce already used");
        });
    });
});
