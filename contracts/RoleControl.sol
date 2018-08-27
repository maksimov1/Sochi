pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract RoleControl is Ownable {
  //роли: никто, торгаш, покупатель + запросы на роли от пользователей
  enum Role {EMPTY, TSP, CLIENT, REQ_TSP, REQ_CLIENT}
  mapping (address => Role) public roles;
   
  uint256 public pricePerToken;
  uint256 public minPayment;
  
  mapping (address => uint256) public phoneByAddress;
  mapping (uint256 => bool) public isPhoneRegistered;
  mapping (uint256 => address) public requests;
  uint256 public numberOfRequests;
  

  function sendRegRequest(uint256 _phone, Role _role) public returns (uint256)
  {
      require(msg.sender != owner);
      require(roles[msg.sender] == Role.EMPTY);
      require(isPhoneRegistered[_phone] == false);
      require(_role == Role.REQ_TSP || _role == Role.REQ_CLIENT);

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
      require(roles[applicant] == Role.REQ_TSP || roles[applicant] == Role.REQ_CLIENT);

      if (roles[applicant] == Role.REQ_TSP) {
          roles[applicant] = Role.TSP;
      } else {
         roles[applicant] = Role.CLIENT;
      }

      numberOfRequests--;
  }

  function rejectRegRequest(uint256 num) onlyOwner public
  {
      address applicant = requests[num];
      require(roles[applicant] == Role.REQ_TSP || roles[applicant] == Role.REQ_CLIENT);

      roles[applicant] = Role.EMPTY;
      isPhoneRegistered[phoneByAddress[applicant]] = false;

      numberOfRequests--;
  }

  constructor() public {
      pricePerToken = 1;
      minPayment = 1;
      numberOfRequests = 0;
  }
  
  function checkRole(address client) public view returns (Role) {
      return roles[client];
  }
  
  function changePrice(uint256 newPrice) public onlyOwner {
      require(newPrice != 0);
      pricePerToken = newPrice;
  }
  
  function changeMinPayment(uint256 newMinPayment) public onlyOwner {
      require(newMinPayment != 0);
      minPayment = newMinPayment;
  }
}

