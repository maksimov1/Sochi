pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract RoleControl is Ownable {
  //роли: никто, админ, торгаш, покупатель + запросы на роли от пользователей
  enum Role {EMPTY, ADMIN, TSP, CLIENT, REQ_TSP, REQ_CLIENT}
  mapping (address => Role) public roles;

  uint256 public pricePerToken;
  uint256 public minPayment;

  mapping (uint256 => address) public requests;

  mapping (uint256 => bool)    private isPhoneRegistered;
  mapping (address => uint256) public phoneByAddress;

  mapping (string => bool)    private isTSPNameRegistered;
  mapping (address => string) public tspNameByAddress;

  mapping (address => uint256) public coalitionByAddress;
  uint256 public numberOfRequests;


  modifier onlyAdmin() {
      require(roles[msg.sender] == Role.ADMIN, "Only admin role can perform this action.");
      _;
  }

  function sendRegTSPRequest(string _name) public returns (uint256) {
      require(roles[msg.sender] == Role.EMPTY, "You are already registered in the system.");
      require(isTSPNameRegistered[_name] == false);

      roles[msg.sender]            = Role.REQ_TSP;
      isTSPNameRegistered[_name]   = true;
      requests[numberOfRequests]   = msg.sender;
      tspNameByAddress[msg.sender] = _name;

      numberOfRequests++;

      return numberOfRequests - 1;
  }

  function isCorrectPhone(uint256 _phone) pure public returns (bool) {
    if (70000000000 <= _phone && _phone <= 79999999999) {
      return true;
    }
    return false;
  }

  function sendRegClientRequest(uint256 _phone) public returns (uint256) {
      require(roles[msg.sender] == Role.EMPTY, "You are already registered in the system.");
      require(isCorrectPhone(_phone), "The phone number is incorrect.");
      require(isPhoneRegistered[_phone] == false, "The phone has been already registered.");

      isPhoneRegistered[_phone]  = true;
      roles[msg.sender]          = Role.REQ_CLIENT;
      requests[numberOfRequests] = msg.sender;
      phoneByAddress[msg.sender] = _phone;

      numberOfRequests++;

      return numberOfRequests - 1;
  }

  function applyRegRequest(uint256 _num, uint256 _coalition) onlyAdmin public {
      address applicant = requests[_num];
      require(roles[applicant] == Role.REQ_TSP || roles[applicant] == Role.REQ_CLIENT, "Can''t register this address.");

      if (roles[applicant] == Role.REQ_TSP) {
          roles[applicant]              = Role.TSP;
          coalitionByAddress[applicant] = _coalition;
      } else {
         roles[applicant] = Role.CLIENT;
      }
  }

  function addAdmin(address _addr) onlyOwner public {
     require(roles[_addr] == Role.EMPTY, "This address is already registered in the system with a different role.");

     roles[_addr]          = Role.ADMIN;
     phoneByAddress[_addr] = 74959137474;
  }

  // Этой функции в реальной системе быть не должно
  // Она служит демонстрационным целям
  // В реальности администраторов может назначать
  // только владелец контракта, так как это делается
  // в функции выше: addAdmin.
  function testAddAdmin(address _addr) public {
     require(roles[_addr] == Role.EMPTY, "This address is already registered in the system with a different role.");

     roles[_addr]          = Role.ADMIN;
     phoneByAddress[_addr] = 74959137474;
  }

  constructor() public {
      pricePerToken    = 1;
      minPayment       = 1;
      numberOfRequests = 0;

      roles[owner]                             = Role.ADMIN;
      phoneByAddress[owner]                    = 74959137474;
      isPhoneRegistered[phoneByAddress[owner]] = true;
  }

  function checkRole(address _client) public view returns (Role) {
      return roles[_client];
  }

  // В реальности должен быть onlyOwner,
  // но в демонстрационных целях мы разрешаем onlyAdmin
  //function changePrice(uint256 newPrice) public onlyOwner {
  function changePrice(uint256 _newPrice) public onlyAdmin {
      require(_newPrice != 0, "The price can't be zero.");
      pricePerToken = _newPrice;
  }

  // В реальности должен быть onlyOwner,
  // но в демонстрационных целях мы разрешаем onlyAdmin
  //function changeMinPayment(uint256 newMinPayment) public onlyOwner {
  function changeMinPayment(uint256 _newMinPayment) public onlyAdmin {
      require(_newMinPayment != 0, "The mininal payment can't be zero.");
      minPayment = _newMinPayment;
  }
}
