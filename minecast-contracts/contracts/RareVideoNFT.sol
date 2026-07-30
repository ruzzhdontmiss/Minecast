// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RareVideoNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event VideoMinted(address indexed minter, uint256 indexed tokenId, string tokenURI, uint256 rarityScore);

    constructor() ERC721("MineCast Rare Video", "MCRV") Ownable(msg.sender) {}

    function mintVideo(address to, string memory uri, uint256 rarityScore) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit VideoMinted(to, tokenId, uri, rarityScore);
        
        return tokenId;
    }
}
