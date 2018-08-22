pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract RoleControl is Ownable {
  //роли: никто, торгаш, покупатель + логика создателя контракта
  enum Role {EMPTY, SELLER, BUYER, SELLER_REQUESTED, BUYER_REQUESTED}
  mapping (address => Role) public roles;
   
  uint256 public pricePerToken;
  uint256 public minPayement;
  
  mapping (address => uint256) public phoneByAddress;
  mapping (uint256 => bool) public isPhoneRegistered;
  mapping (uint256 => address) public requests;
  uint256 public numberOfRequests;
  

  function sendRegRequest(uint256 _phone, Role _role) public returns (uint256)
  {
      require(roles[msg.sender] == Role.EMPTY);
      require(isPhoneRegistered[_phone] == false);
      require(_role == Role.SELLER_REQUESTED || _role == Role.BUYER_REQUESTED);
      isPhoneRegistered[_phone] = true;
      roles[msg.sender] = _role;
      requests[numberOfRequests] = msg.sender;
      phoneByAddress[msg.sender] = _phone;
      numberOfRequests++;
      return numberOfRequests - 1;
  } 

  function applyRegRequest(uint256 num) onlyOwner public
  {
      address applicant = requests[num];
      require(roles[applicant] == Role.SELLER_REQUESTED || roles[applicant] == Role.BUYER_REQUESTED);
      if(roles[applicant] == Role.SELLER_REQUESTED)
      {
          roles[applicant]=Role.SELLER;
      }
      else
      {
       roles[applicant]=Role.BUYER;   
      }
  } 

  constructor() public {
      pricePerToken = 1;
      minPayement = 1;
      numberOfRequests = 0;
  }
  
  function setRole(address client, Role _role) public onlyOwner {
      roles[client] =_role;
  }
  
  function checkRole(address client) public view returns (Role) {
      return roles[client];
  }
  
  function changePrice(uint256 newPrice) public onlyOwner {
      require(newPrice != 0);
      pricePerToken = newPrice;
  }
  
  function changeMinPayement(uint256 newMinPayement) public onlyOwner {
      require(newMinPayement != 0);
      minPayement = newMinPayement;
  }
}

