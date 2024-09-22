// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Swineherd {

    address creator;

    constructor() {
        creator = msg.sender;
    }

    function audit(bytes calldata) public payable {
        require(msg.sender == creator, "Audit logs can be sent only by creator");
        // At least for now, don't do anything
    }
}