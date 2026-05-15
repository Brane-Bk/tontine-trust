// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TontineChainProof
/// @notice Minimal proof registry for the hackathon MVP.
/// Funds remain on local payment rails; this contract anchors immutable hashes.
contract TontineChainProof {
    address public owner;

    event ProofAnchored(
        bytes32 indexed groupId,
        bytes32 indexed proofType,
        bytes32 payloadHash,
        address indexed actor,
        uint256 anchoredAt
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        require(nextOwner != address(0), "zero owner");
        owner = nextOwner;
    }

    function anchorProof(
        bytes32 groupId,
        bytes32 proofType,
        bytes32 payloadHash,
        address actor
    ) external onlyOwner {
        emit ProofAnchored(groupId, proofType, payloadHash, actor, block.timestamp);
    }
}
