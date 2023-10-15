// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {IMailbox} from "./interfaces/IMailbox.sol";
import {IInterchainGasPaymaster} from "./interfaces/IInterchainGasPaymaster.sol";
import {IMessageRecipient} from "./interfaces/IMessageRecipient.sol";

contract CrossX is IMessageRecipient {
    IMailbox constant mailbox =
        IMailbox(0xCC737a94FecaeC165AbCf12dED095BB13F037685);
    IInterchainGasPaymaster constant igp =
        IInterchainGasPaymaster(0xF90cB82a76492614D07B82a7658917f3aC811Ac1);
    uint256 gasAmount = 10000;

    // for access control on handle implementations
    modifier onlyMailbox() {
        require(msg.sender == address(mailbox));
        _;
    }

    // @dev This function is used to deploy the contract across multiple chains
    // @param destinationChainSelector - destination chain selector of chainlink
    // @param salt - the salt used to create the contract address
    // @param bytecode - the bytecode of the contract
    // @param initializeData - the data used inside the initialize function of the contract
    function DeployOnMultiChainsbytes32(
        uint32[] calldata destinationDomain,
        bytes32 salt,
        bytes memory bytecode,
        uint256[] calldata relayerFee,
        bytes memory initializeData,
        uint256 totalFee
    ) external payable {
        require(msg.value >= totalFee, "msg.value must equal totalFee");
        if (destinationDomain.length != relayerFee.length) {
            revert("destinationDomain and relayerFee must be the same length");
        }
        // deploy contract on present chain
        deployContract(salt, bytecode, initializeData);
        // encoding the data to pass to other chains
        bytes memory payload = abi.encode(salt, bytecode, initializeData);
        // sending deploy msg to other chains
        for (uint i = 0; i < destinationDomain.length; ) {
            bytes32 messageId = mailbox.dispatch(
                destinationDomain[i],
                addressToBytes32(address(this)),
                payload
            );
            igp.payForGas{value: relayerFee[i]}(
                messageId, // The ID of the message that was just dispatched
                destinationDomain[i], // The destination domain of the message
                gasAmount, // 100k gas to use in the recipient's handle function
                msg.sender // refunds go to msg.sender, who paid the msg.value
            );
            unchecked {
                ++i;
            }
        }
    }

    // alignment preserving cast
    function addressToBytes32(address _addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function handle(
        uint32,
        bytes32,
        bytes memory _body
    ) external override onlyMailbox {
        (bytes32 salt, bytes memory bytecode, bytes memory initializeData) = abi
            .decode(_body, (bytes32, bytes, bytes));
        deployContract(salt, bytecode, initializeData);
    }

    // This function is used to deploy and initialize a contract
    // @param salt - the salt used to generate the address
    // @param bytecode - the bytecode of the contract
    // @param initializable - whether the contract is initializable
    // @param initializeData - the data used to initialize the contract
    // @return address - the address of the deployed contract
    function deployContract(
        bytes32 salt,
        bytes memory bytecode,
        bytes memory initializeData
    ) public returns (address) {
        address deployedAddress = deploy(salt, bytecode);
        // transfer ownership to the _originSender
        if (initializeData.length > 0) {
            (bool success, ) = deployedAddress.call(initializeData);
            require(success, "initiailse failed");
        }
        return deployedAddress;
    }

    // @dev This function is used to deploy a contract using CREATE2
    // @param salt - the salt used to generate the address
    // @param bytecode - the bytecode of the contract
    // @return address - the address of the deployed contract
    function deploy(
        bytes32 salt,
        bytes memory bytecode
    ) public returns (address) {
        return Create2.deploy(0, salt, bytecode);
    }

    // @dev This function is used to compute the address of the contract that will be deployed
    // @param salt - the salt used to generate the address
    // @param bytecode - the bytecode of the contract
    // @return address - the computed address of the contract that will be deployed
    function computeAddress(
        bytes32 salt,
        bytes memory bytecode
    ) public view returns (address) {
        return Create2.computeAddress(salt, keccak256(bytecode));
    }

    receive() external payable {}
}
