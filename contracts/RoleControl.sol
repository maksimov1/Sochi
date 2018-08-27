pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract RoleControl is Ownable {
  //роли: никто, админ, торгаш, покупатель + запросы на роли от пользователей
  enum Role {EMPTY, ADMIN, TSP, CLIENT, REQ_TSP, REQ_CLIENT}
  mapping (address => Role) public roles;

  uint256 public pricePerToken;
  uint256 public minPayment;

  mapping (address => uint256) public phoneByAddress;
  mapping (uint256 => bool) public isPhoneRegistered;
  mapping (uint256 => address) public requests;
  uint256 public numberOfRequests;


  modifier onlyAdmin() {
      require(roles[msg.sender] == Role.ADMIN);
      _;
  }

  function sendRegRequest(uint256 _phone, Role _role) public returns (uint256)
  {
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

  function applyRegRequest(uint256 _num, uint256 coalition) onlyAdmin public
  {
      address applicant = requests[_num];
      require(roles[applicant] == Role.REQ_TSP || roles[applicant] == Role.REQ_CLIENT);

      if (roles[applicant] == Role.REQ_TSP) {
          roles[applicant] = Role.TSP;
          coalitionByAddress[applicant] = coalition;
      } else {
         roles[applicant] = Role.CLIENT;
      }
  }

  //function addAdmin() onlyOwner public
  //Для демонстрации и тестирования onlyOwner убран
  function addAdmin(address _addr) public
  {
     require(roles[_addr] == Role.EMPTY);
     roles[_addr] = Role.ADMIN;
  }

  constructor() public {
      pricePerToken    = 1;
      minPayment       = 1;
      numberOfRequests = 0;

      roles[owner]                             = Role.ADMIN;
      phoneByAddress[owner]                    = 74959137474;
      isPhoneRegistered[phoneByAddress[owner]] = true;
  }

  function checkRole(address client) public view returns (Role) {
      return roles[client];
  }

  // В реальности должен быть onlyOwner,
  // но в демонстрационных целях мы разрешаем onlyAdmin
  //function changePrice(uint256 newPrice) public onlyOwner {
  function changePrice(uint256 newPrice) public onlyAdmin {
      require(newPrice != 0);
      pricePerToken = newPrice;
  }

  // В реальности должен быть onlyOwner,
  // но в демонстрационных целях мы разрешаем onlyAdmin
  //function changeMinPayment(uint256 newMinPayment) public onlyOwner {
  function changeMinPayment(uint256 newMinPayment) public onlyAdmin {
      require(newMinPayment != 0);
      minPayment = newMinPayment;
  }
}
