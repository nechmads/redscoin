//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;

contract RedsCoin {
    string public name = "Reds Coin";
    string public symbol = "REDS";

    address internal owner;

    uint256 public totalSupply;
    uint256 public totalReservedSupply;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    mapping(address => uint256) internal balances;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply;
        balances[msg.sender] = _initialSupply / 2;
        totalReservedSupply = _initialSupply / 2;
    }

    modifier onlyOwner {
      require(msg.sender == owner, "You don't have permissions to do this");
      _;
   }

    function openSupply() public view returns(uint256 supply) {
        return balances[owner];
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value, "Not enough token");

        balances[msg.sender] -= _value;
        balances[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balances[_from]);
        require(_value <= allowance[_from][msg.sender]);

        balances[_from] -= _value;
        balances[_to] += _value;

        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

    function freeReservedSupply(uint256 _value) public onlyOwner returns(bool success) {
        require(totalReservedSupply >= _value, "There is not enough reserved supply");

        totalReservedSupply -= _value;
        balances[owner] += _value;

        return true;
    }
}