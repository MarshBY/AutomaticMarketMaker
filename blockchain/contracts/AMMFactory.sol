// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AMM.sol";

contract AMMFactory {
    mapping(address => mapping(address => address)) public pools;

    event PoolCreated(address indexed pool, address indexed token1, address indexed token2);

    function createPool(address _token1, address _token2) external {
        require(_token1 != address(0));
        require(_token2 != address(0));
        require(pools[_token1][_token2] == address (0));
        //require(pools[_token2][_token1] == address (0));

        AMM newPool = new AMM(_token1, _token2);
        pools[_token1][_token2] = address(newPool);
        pools[_token2][_token1] = address(newPool);

        emit PoolCreated(address(newPool), _token1, _token2);
    }
}