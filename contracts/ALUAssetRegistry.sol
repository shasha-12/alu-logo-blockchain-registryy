// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ALUAssetRegistry is ERC721 {
    struct AssetMetadata {
        string name;
        string fileType;
        bytes32 contentHash;
        address registrant;
        uint256 timestamp;
    }

    uint256 private _nextTokenId;

    mapping(uint256 => AssetMetadata) public assets;
    mapping(bytes32 => bool) public registeredHashes;

    event AssetRegistered(
        uint256 indexed tokenId,
        string name,
        bytes32 indexed contentHash,
        address indexed registrant,
        uint256 timestamp
    );

    constructor() ERC721("ALU Official Logo", "ALUL") {
        _nextTokenId = 1;
    }

    function registerAsset(
        string memory name,
        string memory fileType,
        bytes32 contentHash
    ) public returns (uint256 tokenId) {
        require(bytes(name).length != 0, "Asset name cannot be empty");
        require(bytes(fileType).length != 0, "File type cannot be empty");
        require(contentHash != bytes32(0), "Content hash cannot be empty");
        require(
            !registeredHashes[contentHash],
            "Asset already registered: duplicate content hash"
        );

        tokenId = _nextTokenId;
        unchecked {
            _nextTokenId = tokenId + 1;
        }

        _safeMint(msg.sender, tokenId);

        assets[tokenId] = AssetMetadata({
            name: name,
            fileType: fileType,
            contentHash: contentHash,
            registrant: msg.sender,
            timestamp: block.timestamp
        });

        registeredHashes[contentHash] = true;

        emit AssetRegistered(
            tokenId,
            name,
            contentHash,
            msg.sender,
            block.timestamp
        );
    }

    function verifyLogoIntegrity(
        uint256 tokenId,
        bytes32 contentHash
    ) public view returns (bool isAuthentic, string memory message) {
        _requireOwned(tokenId);

        if (assets[tokenId].contentHash == contentHash) {
            return (true, "Logo is authentic.");
        }

        return (false, "Warning: logo does not match.");
    }

    function getAsset(
        uint256 tokenId
    ) public view returns (AssetMetadata memory) {
        _requireOwned(tokenId);
        return assets[tokenId];
    }
}
