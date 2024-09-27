// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract Swineherd {

    address auditor;

    constructor(address mainAuditor) {
        auditor = mainAuditor;
    }

    function audit(bytes calldata) public payable {
        require(msg.sender == auditor, "Audit logs can be sent only by creator");
        // At least for now, don't do anything
    }
}