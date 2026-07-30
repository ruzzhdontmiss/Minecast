// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public rewardToken;
    address public signerAddress;

    // Track used nonces for generic claims
    mapping(uint256 => bool) public usedNonces;

    // Track claimed videos to prevent multiple claims per video per user
    mapping(address => mapping(string => bool)) public hasClaimedVideo;

    event RewardClaimed(address indexed user, uint256 amount, uint256 nonce);
    event VideoRewardClaimed(address indexed user, string videoId, uint256 amount);
    event SignerUpdated(address oldSigner, address newSigner);
    event RewardTokenUpdated(address oldToken, address newToken);

    constructor(address _rewardToken, address _signerAddress) Ownable(msg.sender) {
        require(_rewardToken != address(0), "Invalid reward token");
        require(_signerAddress != address(0), "Invalid signer address");
        rewardToken = IERC20(_rewardToken);
        signerAddress = _signerAddress;
    }

    function setSignerAddress(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        emit SignerUpdated(signerAddress, _newSigner);
        signerAddress = _newSigner;
    }

    function setRewardToken(address _newRewardToken) external onlyOwner {
        require(_newRewardToken != address(0), "Invalid reward token");
        emit RewardTokenUpdated(address(rewardToken), _newRewardToken);
        rewardToken = IERC20(_newRewardToken);
    }

    function claimReward(uint256 amount, uint256 nonce, bytes memory signature) external {
        require(!usedNonces[nonce], "Nonce already used");
        require(amount > 0, "Amount must be greater than 0");

        // Verify the signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, amount, nonce, address(this)));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(recoveredSigner == signerAddress, "Invalid signature");

        // Mark nonce as used
        usedNonces[nonce] = true;

        // Transfer tokens to the user
        rewardToken.safeTransfer(msg.sender, amount);

        emit RewardClaimed(msg.sender, amount, nonce);
    }

    function claimVideoReward(string memory videoId, bytes memory signature) external {
        require(!hasClaimedVideo[msg.sender][videoId], "Reward already claimed for this video");

        // Fixed amount per valid view: 10 MT
        uint256 rewardAmount = 10 * 10**18;

        // Verify the signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, videoId, address(this)));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, signature);
        require(recoveredSigner == signerAddress, "Invalid signature");

        // Mark video as claimed for this user
        hasClaimedVideo[msg.sender][videoId] = true;

        // Transfer tokens to the user
        rewardToken.safeTransfer(msg.sender, rewardAmount);

        emit VideoRewardClaimed(msg.sender, videoId, rewardAmount);
    }
    
    // Emergency withdraw for owner to pull any stuck ERC20 tokens
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
