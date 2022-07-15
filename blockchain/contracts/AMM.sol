// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

//-----Debug------
//import "hardhat/console.sol";

contract Token is ERC20 {

    constructor (string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }
}
//----------------

contract AMM is ERC20{

    address public immutable token1;
    address public immutable token2;

    uint public reserves1;
    uint public reserves2;

    constructor(address _token1, address _token2) ERC20("LP Tokens", "LP") {
        token1 = _token1;
        token2 = _token2;
    }

    function addLiquidity(uint _amount1, uint _amount2) external {
        if(reserves2 > 0){
            //Check Liq ratio is correct
            require(_amount2 == requiredAmount(_amount1, true));
        }

        //No need to check allowance as it will revert, frontend should check allowance before sending tx
        ERC20(token1).transferFrom(msg.sender, address(this), _amount1);
        ERC20(token2).transferFrom(msg.sender, address(this), _amount2);

        //Send LP
        if(reserves2 == 0){
            //console.log(_amount1 * _amount2);
            _mint(msg.sender, Math.sqrt(_amount1*_amount2));
        }else {
            _mint(msg.sender, (totalSupply() * ((_amount1 * 100) / reserves1)) / 100);
        }

        //Update reserves
        reserves1 += _amount1;
        reserves2 += _amount2;
    }

    function removeLiquidity(uint _LPtokens) external {
        uint _totalSupply = totalSupply(); //Save gas

        require(_LPtokens < _totalSupply);
        require(_LPtokens <= balanceOf(msg.sender));

        uint ratio = (_LPtokens * 100) / _totalSupply; //Have to use *100 because its uint

        uint t1 = reserves1 * ratio / 100;
        uint t2 = reserves2 * ratio / 100;

        require(t1 > 0 && t2 > 0);

        ERC20(token1).transfer(msg.sender, t1);
        ERC20(token2).transfer(msg.sender, t2);

        _burn(msg.sender, _LPtokens);
        
        //Update reserves
        reserves1 -= t1;
        reserves2 -= t2;
    }

    function swap(uint _amountIn, uint _expectedOutAmount, bool _direction) external { //True is 1 -> 2 | False is 2 -> 1
        require(_amountIn > 0);
        //Saves gas:
        uint _reserves1 = reserves1;
        uint _reserves2 = reserves2;

        uint fees = _amountIn / 100; //1%

        if(_direction) { // 1 -> 2
            uint _amountOut = _reserves2 - ((_reserves1*_reserves2) / (_reserves1 + (_amountIn - fees)));
            //console.log("Amount out", _amountOut);
            require(_amountOut >= _expectedOutAmount, "Not enough expected");
            ERC20(token2).transfer(msg.sender, _amountOut);

            //Update reserves
            reserves1 += _amountIn;
            reserves2 -= _amountOut;
        }else { // 2 -> 1
            uint _amountOut = _reserves1 - ((_reserves2*_reserves1) / (_reserves2 + (_amountIn - fees)));
            //console.log("Amount out", _amountOut);
            require(_amountOut >= _expectedOutAmount, "Not enough expected");
            ERC20(token1).transfer(msg.sender, _amountOut);

            //Update reserves
            reserves2 += _amountIn;
            reserves1 -= _amountOut;
        }
    }

    function expectOut(uint _amountIn, bool _direction) external view returns(uint _expectedOutAmount) {
        //Saves gas: (If another contract has to call)
        uint _reserves1 = reserves1;
        uint _reserves2 = reserves2;

        uint fees = _amountIn / 100; //1%

        if(_direction) { // 1 -> 2
            _expectedOutAmount = _reserves2 - ((_reserves1*_reserves2) / (_reserves1 + (_amountIn - fees)));
        }else { // 1 -> 2
            _expectedOutAmount = _reserves1 - ((_reserves2*_reserves1) / (_reserves2 + (_amountIn - fees)));
        }
    }

    function requiredAmount(uint _amount, bool _direction) public view returns(uint) {
        if(_direction) { // returns How much of Token2 required
            return(_amount * reserves2 / reserves1);
        }else{ //returns How much of Token1 required
            return(_amount * reserves1 / reserves2);
        }
    }


    //DEBUGGING---------------
    function getK() external view returns(uint) {
        return(reserves1*reserves2);
    }

    function getRatio() external view returns(uint) {
        return(reserves1/reserves2);
    }
}