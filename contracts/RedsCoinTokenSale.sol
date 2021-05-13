//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;

import "./RedsCoin.sol";
import "hardhat/console.sol";

contract RedsCoinTokenSale {
    address admin;
    RedsCoin public redsCoinContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;
    uint256 public maximumGiftAmount;

    mapping(address => uint256) internal giftedTokens;

    event Sell(address _buyer, uint256 amount);

    constructor(RedsCoin _contract, uint256 _price, uint256 _maximumGiftAmount) {
        admin = msg.sender;
        redsCoinContract = _contract;
        tokenPrice = _price;
        maximumGiftAmount = _maximumGiftAmount;
    }

    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x);
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        require (msg.value == multiply(_numberOfTokens, tokenPrice), "You need to pay more for that");

        require(redsCoinContract.balanceOf(address(this)) >= _numberOfTokens, "Not enough tokens for sale");

        require(redsCoinContract.transfer(msg.sender, _numberOfTokens));

        tokensSold += _numberOfTokens;

        Sell(msg.sender, _numberOfTokens);
    }

    function claimGiftTokens(uint256 _numberOfTokens) public {
        require(_numberOfTokens < maximumGiftAmount - giftedTokens[msg.sender], "You can't claim that many gift tokens");

        redsCoinContract.transfer(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin, "You don't have permissions to do that");
        require(redsCoinContract.transfer(admin, redsCoinContract.balanceOf(address(this))));
    }

}