import Web3 from 'web3';
import BlurContractDesc from '../../../build/contracts/BlueRubleABI.json';

import('./ui');


var Role = {
   EMPTY       : 0,
   ADMIN       : 1,
   TSP         : 2,
   CLIENT      : 3,
   REQ_TSP     : 4,
   REQ_CLIENT  : 5
};

var RoleToText = {
   0 : "EMPTY",
   1 : "ADMIN",
   2 : "TSP",
   3 : "CLIENT",
   4 : "REQ_TSP",
   5 : "REQ_CLIENT"
};

var RoleToRuText = {
   0 : "Незарегистрированный пользователь",
   1 : "Администратор",
   2 : "ТСП",
   3 : "Клиент",
   4 : "ТСП без подверждения регистрации",
   5 : "Клиент без подтверждения регистрации"
};


const ErrColor="red";
const InfoColor="#FF9966";

var BN;
var QrScanner;
var VideoCameraSupported = false;
var VideoInScanningProcess = false;
var Scanner;

var Blur;
var CurrentAccount;
var CurrentBalance;
var CurrentRole;
var CurrentPrice;
var CurrentRegRequest;

async function load_contract() {
   var net_id = await web3.eth.net.getId();
   console.log("NetworkID: " + net_id);
   if (net_id in BlurContractDesc.networks) {
      Blur = new web3.eth.Contract(
         BlurContractDesc.abi,
         BlurContractDesc.networks[net_id].address
      );
      // Just to debug in Chrome
      window.Blur = Blur;

      return Blur;
   } else {
      alert("The contract is not deployed in the network " + net_id);
   }
}

async function slow_update_contract_info() {
   var change_detected = false;
   var current_account = (await web3.eth.getAccounts())[0];
   if (current_account) {
      if (current_account !== CurrentAccount) {
         change_detected = true;
         CurrentAccount = current_account;
         Blur.options.from = CurrentAccount;
         console.log("Current Account: " + CurrentAccount);
      }
      var role = await check_role(current_account);
      if (role !== CurrentRole) {
         change_detected = true;
         CurrentRole = role;
         window.sessionStorage.removeItem("disallow_redirect");
         console.log("Role Update: " + RoleToText[CurrentRole]);
      }
      var balance = await balance_of(current_account);
      if (!balance.eq(CurrentBalance)) {
         change_detected = true;
         CurrentBalance = balance;
         console.log("Balance Update: " + CurrentBalance);
      }
      var price = await price_per_token();
      if (!price.eq(CurrentPrice)) {
         change_detected = true;
         CurrentPrice = price;
         console.log("Price Update: " + CurrentPrice);
      }
      var reg_request = await number_of_registration_requests();
      if (reg_request !== CurrentRegRequest) {
         change_detected = true;
         CurrentRegRequest = reg_request;
         console.log("New Reg Request: " + CurrentRegRequest);
      }
   }
   if (change_detected) {
      update_info_panel();
   }
}

async function update_info_panel() {

   $("#current_role").html('');
   $("#current_balance").html('');
   $("#current_token_price").html('');
   $('#current_registration_request').html('');

   var cur_account = CurrentAccount;
   var role = CurrentRole;
   var balance = CurrentBalance;
   var price = CurrentPrice;
   var reg_request = CurrentRegRequest;

   $("#current_role").html(`<b><font color='${InfoColor}'>Ваша роль в системе: ${RoleToRuText[role]}</font><b>`);

   if (role == Role.CLIENT || role == Role.TSP) {
      $("#current_balance").html(`<b><font color='${InfoColor}'>Ваши баллы: ${balance}</font><b>`);
   }

   $("#current_token_price").html(`<b><font color='${InfoColor}'>Стоимость балла: ${price}</font></b>`);

   $('#current_registration_request').html(`<b><font color='${InfoColor}'>Номер последней заявки на регистрацию: ${reg_request}</font></b>`);

   if ($('#qrious').length && window.qr && (window.qr.value != cur_account)) {
      window.qr.value = cur_account;
   }
}

function is_ciper() {
   return !!window.__CIPHER__;
}

/*function is_webrtc_supported() {
   return navigator.getUserMedia   ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia    ||
      navigator.msGetUserMedia     ||
      window.RTCPeerConnection;
}*/

function web3_support_qr_scan() {
   return !!(
      window.web3 &&
      window.web3.currentProvider &&
      window.web3.currentProvider.scanQRCode
   );
}

function can_scan_qr_code() {
   return web3_support_qr_scan();
}


function init_page() {

   if (web3_support_qr_scan()) {
      $('#ClientScanQRCodeButton').prop("disabled", false);
      $('#TspScanQRCodeButton').prop("disabled", false);
   } else {
      if ($('#QRVideo').length) {
         navigator.getMedia({video: true}, function() {
            import(/* webpackPrefetch: true */ './../vendor/qr-scanner.min.js').then(module => {
               VideoCameraSupported = true;
               $('#ClientScanQRCodeButton').prop("disabled", false);
               $('#TspScanQRCodeButton').prop("disabled", false);
               QrScanner = module.default;
            });
         }, function () {});
      }
   }

   if ($('#qrious').length) {
      import(/* webpackPreload: true */ './../vendor/qrious.min.js').then(module => {
         var QRious = module.default;
         window.qr = new QRious({
            element: document.getElementById('qrious'),
            level: 'Q',
            size: 250,
            value: CurrentAccount
         });
      });
   }
}

function redirect_to_page(page, desc) {
   var secs = 3;
   var timer = setInterval(function() {
      $('#RedirectStatus').html(`<h2>Вы будете автоматически перенаправлены на страницу ${desc} через ${secs}</h2>`);
      secs = secs - 1;
      if (secs <= 0) {
         clearInterval(timer);
         $('#RedirectStatus').html('');
      }
   }, 1000);

   setTimeout(function() {
      window.sessionStorage.setItem("disallow_redirect", "true");
      window.location.replace(page);
   }, 3000);

   setTimeout(function() {
      window.sessionStorage.removeItem("disallow_redirect");
   }, 300000); // 5 minutes
}

function check_redirect() {
   if (window.sessionStorage) {
      var path = window.location.pathname;
      if (path === '/' || path === '/index.html') {
         if (!window.sessionStorage.getItem("disallow_redirect")) {
            if (CurrentRole == Role.ADMIN) {
               redirect_to_page("/bank.html", "банка");
            } else if (CurrentRole == Role.TSP) {
               redirect_to_page("/tsp.html", "ТСП");
            } else if (CurrentRole == Role.CLIENT) {
               redirect_to_page("/client.html", "клиента");
            } else {
               console.log("will not redirect for role " + CurrentRole);
            }
         } else {
            console.log("redirection disallowed");
         }
      }
   }
}

async function init_contract() {
   await load_contract();

   CurrentAccount    = (await web3.eth.getAccounts())[0];
   CurrentBalance    = await balance_of(CurrentAccount);
   CurrentRole       = await check_role(CurrentAccount);
   CurrentPrice      = await price_per_token();
   CurrentRegRequest = await number_of_registration_requests();

   Blur.options.from = CurrentAccount;

   check_redirect();

   setInterval(function() {
      slow_update_contract_info();
   }, 1000);

   update_info_panel();
   init_page();

   return CurrentAccount;
}


async function get_owner() {
   var owner = await Blur.methods.owner().call();
   console.log("Contract Owner: " + owner);
   return owner;
}

async function balance_of(addr) {
   var balance = await Blur.methods.balanceOf(addr).call();
   return new BN(balance, 10);
}

async function check_role(addr) {
   var role = await Blur.methods.checkRole(addr).call();
   return role;
}

async function get_total_amount() {
   var total = await Blur.methods.totalSupply().call();
   console.log("Total number of tokens: " + total);
   return new BN(total, 10);
}

async function price_per_token() {
   var price = await Blur.methods.pricePerToken().call();
   return new BN(price, 10);
}

async function min_payment() {
   var min = await Blur.methods.minPayment().call();
   console.log("Min payment: " + min);
   return new BN(min, 10);
}

async function number_of_registration_requests() {
   var num = await Blur.methods.numberOfRequests().call();
   return num;
}


function button_start(btn) {
   var btn_val = btn.html();
   btn.prop("disabled", true);
   btn.html(`<i class="fa fa-spinner fa-spin"></i>${btn_val}`);
   return btn_val;
}

function button_stop(btn) {
   var btn_val = btn.html();
   btn.prop("disabled", false);
   btn.html(btn_val.substring('<i class="fa fa-spinner fa-spin"></i>'.length));
   return btn_val;
}

function status_receipt(label) {
   return function(receipt) { label.text("Статус: Началась обработка") };
}

function status_confirmation(label, btn) {
   return function(number, receipt) {
      // should be done automatically
      /*if (number == 12) {
         update_info_panel();
      }*/
      if (number <= 12) {
         label.text("Статус: Получено подтверждение (" + number + ")");
      } else if (number == 13) {
         label.text("Статус: Операция успешно завершена");
      } else if (number == 14) {
         label.text('');
         button_stop(btn);
      }
   }
}

function status_error(label, btn) {
   return function(err) {
      console.log(err);

      var msg = 'Ошибка: ' + err.message;

      if (msg.includes('User denied transaction') ||
         msg.includes('Request has been rejected.') ||
         msg.includes('transaction has been discarded') ||
         msg.includes('Transaction not confirmed')) {
         msg = "Транзакция была отклонена.";
      } else if (msg.includes('nonce too low') ||
         msg.includes('nonce may not be larger than') ||
         msg.includes("the tx doesn't have the correct nonce")) {
         msg = "Произошла рассинхронизация кошелька и сети. Попробуйте сбросить кэш у кошелька.";
      } else if (msg.includes('insufficient funds for gas')) {
         msg = "На кошельке недостаточно средств для проведения операции.";
      } else if (msg.includes('intrinsic gas too low') ||
         msg.includes('base fee exceeds gas limit')) {
         msg = "Недостаточно газа для проведения операции. Попробуйте увеличить его кличество."
      } else if (msg.includes('VM Exception while processing transaction')) {
         msg = "Произошла ошибка в контракте.";
      }

      label.html(`<font color='${ErrColor}'>${msg}</font>`);
      button_stop(btn);
   }
}

function check_empty_current_role(err_label) {
   if (CurrentRole != Role.EMPTY) {
      if (CurrentRole != Role.REQ_TSP && CurrentRole != Role.REQ_CLIENT) {
         err_label.html(`<font color='${ErrColor}'>Пользователь уже зарегистрирован в системе как ${RoleToText[CurrentRole]}</font>`);
      } else if (CurrentRole == Role.REQ_TSP) {
         err_label.html(`<font color='${ErrColor}'>Пользователь уже подавал заявку на регистрацию в системе как ТСП</font>`);
      } else if (CurrentRole == Role.REQ_CLIENT) {
         err_label.html(`<font color='${ErrColor}'>Пользователь уже подавал заявку на регистрацию в системе как Клиент</font>`);
      }
      return false;
   }
   return true;
}

function check_admin_current_role(err_label) {
   if (CurrentRole != Role.ADMIN) {
      err_label.html(`<font color='${ErrColor}'>Только Администратор может выполнить это действие</font>`);
      return false;
   }
   return true;
}

function check_tsp_current_role(err_label) {
   if (CurrentRole != Role.TSP) {
      err_label.html(`<font color='${ErrColor}'>Только ТСП может покупать баллы</font>`);
      return false;
   }
   return true;
}

async function check_send(to_addr, value, err_label) {
   if (CurrentRole != Role.TSP && CurrentRole != Role.CLIENT) {
      err_label.html(`<font color='${ErrColor}'>Вы не зарегистрированы ни как Клиент, ни как ТСП в системе. Только эти две роли могут посылать баллы.</font>`);
      return false;
   }

   var addr_role = await check_role(to_addr);
   if (addr_role != Role.TSP && addr_role != Role.CLIENT) {
      err_label.html(`<font color='${ErrColor}'>Вы не можете послать баллы по данному адресу, так как этот пользователь (${RoleToText[addr_role]}) не является ни Клиентом, ни ТСП.</font>`);
      return false;
   }

   if (CurrentRole == Role.TSP && addr_role == Role.TSP) {
      err_label.html(`<font color='${ErrColor}'>ТСП не могут обмениваться баллами между собой.</font>`);
      return false;
   }

   if (web3.utils.toChecksumAddress(CurrentAccount) == web3.utils.toChecksumAddress(to_addr)) {
      err_label.html(`<font color='${ErrColor}'>Нельзя послать баллы самому себе.</font>`);
      return false;
   }

   if (value.gt(CurrentBalance)) {
      err_label.html(`<font color='${ErrColor}'>Вы не можете перевести баллов больше, чем у вас есть.</font>`);
      return false;
   }

   return true;
}



async function send_test_add_admin(addr, label, btn) {
   if (check_empty_current_role(label)) {
      button_start(btn);
      return Blur.methods.testAddAdmin(addr).send()
         .on('receipt', status_receipt(label))
         .on('confirmation', status_confirmation(label, btn))
         .on('error', status_error(label, btn));
   }
}

async function send_client_register_request(phone, label, btn) {
   if (check_empty_current_role(label)) {
      button_start(btn);
      return Blur.methods.sendRegClientRequest(phone).send()
         .on('receipt', status_receipt(label))
         .on('confirmation', async function(number, receipt) {
            if (number <= 12) {
               label.text("Статус: Получено подтверждение (" + number + ")");
            } else if (number == 13) {
               label.text("Статус: Операция успешно завершена");
            } else if (number == 14) {
               var num = await number_of_registration_requests();
               label.html(`<b>Ваш номер регистрации: ${num}</b>`);
               button_stop(btn);
            }
         })
         .on('error', status_error(label, btn));
   }
}

async function send_tsp_register_request(name, label, btn) {
   if (check_empty_current_role(label)) {
      button_start(btn);
      return Blur.methods.sendRegTSPRequest(name).send()
         .on('receipt', status_receipt(label))
         .on('confirmation', async function(number, receipt) {
            if (number <= 12) {
               label.text("Статус: Получено подтверждение (" + number + ")");
            } else if (number == 13) {
               label.text("Статус: Операция успешно завершена");
            } else if (number == 14) {
               var num = await number_of_registration_requests();
               label.html(`<b>Ваш номер регистрации: ${num}</b>`);
               button_stop(btn);
            }
         })
         .on('error', status_error(label, btn));
   }
}

async function send_confirm_registration(application_number, coalition_number, label, btn) {
   if (check_admin_current_role(label)) {
      if (Number(application_number) <= Number(CurrentRegRequest)) {
         console.log("Confirm request: " + application_number + " Coalition: " + coalition_number);
         button_start(btn);
         return Blur.methods.applyRegRequest(application_number, coalition_number).send()
            .on('receipt', status_receipt(label))
            .on('confirmation', status_confirmation(label, btn))
            .on('error', status_error(label, btn));
      } else {
         label.html(`<font color='${ErrColor}'>Подобного номера регистрации не существует.</font>`);
      }
   }
}

async function send_new_token_price(new_price, label, btn) {
   if (check_admin_current_role(label)) {
      button_start(btn);
      return Blur.methods.changePrice(new_price).send()
         .on('receipt', status_receipt(label))
         .on('confirmation', status_confirmation(label, btn))
         .on('error', status_error(label, btn));
   }
}

async function send_transfer(to_addr, value, label, btn) {
   var ok = await check_send(to_addr, value, label);
   if (ok) {
      button_start(btn);
      return Blur.methods.transfer(to_addr, value).send()
         .on('receipt', status_receipt(label))
         .on('confirmation', status_confirmation(label, btn))
         .on('error', status_error(label, btn));
   }
}

async function send_buy_tokens(num, label, btn) {
   if (check_tsp_current_role(label)) {
      var price = CurrentPrice;
      var total_price = num.mul(price);

      console.log("Tsp -> Bank: wants to buy " + num + " tokens by price " + price + " Total: " + total_price);

      button_start(btn);
      return web3.eth.sendTransaction({from: CurrentAccount, to: Blur.options.address, value: total_price})
         .on('receipt', status_receipt(label))
         .on('confirmation', status_confirmation(label, btn))
         .on('error', status_error(label, btn));
   }
}


function isEmpty(str) {
   return (!str || 0 === str.length);
}

function isNumeric(num) {
   return !isNaN(num) && isFinite(num) && (/^\d+$/.test(num));
}

function check_field(field, def_placeholder, err_placeholder) {
   if (isEmpty(field.val())) {
      field.attr('placeholder', err_placeholder);
      return false;
   } else {
      field.attr('placeholder', def_placeholder);
      return true;
   }
}

function check_phone(phone, def_placeholder, err_placeholder, err_label) {
   var phone_val = phone.val().replace(/[^0-9]/g, '');
   console.log(phone_val);
   if (isEmpty(phone_val)) {
      phone.attr('placeholder', err_placeholder);
      return false;
   } else if (phone_val > 79999999999 || phone_val < 70000000000) {
      err_label.html(`<font color='${ErrColor}'>Пожалуйста введите корректный номер телефона</font>`);
      return false;
   } else {
      phone.attr('placeholder', def_placeholder);
      return true;
   }
}

function check_address(address, def_placeholder, err_placeholder, err_label) {
   var address_val = address.val();
   if (isEmpty(address_val)) {
      address.attr('placeholder', err_placeholder);
      return false;
   } else if (!web3.utils.isAddress(address_val)) {
      err_label.html(`<font color='${ErrColor}'>Пожалуйста, введите корректный ethereum адрес</font>`);
      return false;
   } else {
      address.attr('placeholder', def_placeholder);
      return true;
   }
}

function check_number(num, def_placeholder, err_placeholder, err_label) {
   var num_val = num.val();
   if (isEmpty(num_val)) {
      num.attr('placeholder', err_placeholder);
      return false;
   } else if (!isNumeric(num_val)) {
      err_label.html(`<font color='${ErrColor}'>Пожалуйста, введите корректное число</font>`);
      return false;
   } else if (num_val <= 0) {
      err_label.html(`<font color='${ErrColor}'>Пожалуйста, введите число больше нуля.</font>`);
      return false;
   } else {
      num.attr('placeholder', def_placeholder);
      return true;
   }
}


navigator.getMedia = (
   navigator.getUserMedia       ||
   navigator.webkitGetUserMedia ||
   navigator.mozGetUserMedia    ||
   navigator.msGetUserMedia
);

// Test Web3 Loading
$(window).on('load', function() {
   // Supports Metamask and Mist, and other wallets that provide 'web3'.
   if (typeof web3 !== 'undefined') {
      // Use the Mist/wallet provider.
      window.web3 = new Web3(web3.currentProvider);
   } else {
      alert("Пожалуйста, установите Cipher Browser https://www.cipherbrowser.com/ на мобильный телефон или используйте MetaMask.");
      window.web3 = new Web3.providers.HttpProvider('http://localhost:8545');
      return;
   }
   web3 = window.web3;
   BN = web3.utils.BN;
   console.log("Web3 version: " + web3.version);

   init_contract();


   $("#BankChangeTokenPriceButton").click(function () {
      var err_field = $("#PriceChangeTxStatus");
      var new_price = $("#NewTokenPrice");
      if (
         check_number(new_price, "Введите новую цену балла", "Пожалуйста, введите новую цену балла", err_field)
      ) {
         new_price = new BN(new_price.val(), 10);
         console.log("New Token Price: " + new_price);
         send_new_token_price(new_price, err_field, $("#BankChangeTokenPriceButton"));
      }
   });

   $("#ClientSendTokensButton").click(function () {
      var err_field = $("#SendTokensTxStatus");
      var address = $("#TspClientAddress");
      var count   = $("#TokenCount");
      if (
         check_address(address, "Введите адрес ТСП/Клиента", "Пожалуйста, введите адрес ТСП/Клиента", err_field) &&
         check_number(count, "Введите количество баллов", "Пожалуйста, введите количество баллов", err_field)
      ) {
         address = address.val();
         count = new BN(count.val(), 10);
         console.log("Client -> Tsp: " + address + " Count: " + count);
         send_transfer(address, count, err_field, $("#ClientSendTokensButton"));
      }
   });

   $("#ClientScanQRCodeButton").click(function () {
      if (web3_support_qr_scan()) {
         web3.currentProvider
            .scanQRCode()
            .then(data => {
               console.log('QR Scanned:', data);
               data = data.substring(data.indexOf(":") + 1);
               $("#TspClientAddress").val(data);
            })
            .catch(err => {
               console.log('Error:', err)
            });
      } else if (VideoCameraSupported) {
         if (!VideoInScanningProcess) {
            VideoInScanningProcess = true;
            $("#ClientScanQRCodeButton").html('ОТМЕНИТЬ');
            const video = document.getElementById('QRVideo');
            Scanner = new QrScanner(video, result => {
               console.log('QR Scanned:', result);
               result = result.substring(result.indexOf(":") + 1);
               $("#TspClientAddress").val(result);
               $('#QRVideo').hide();
               $("#ClientScanQRCodeButton").html('Сканировать QR код');
               VideoInScanningProcess = false;
               Scanner.stop();
               Scanner = null;
            });
            Scanner.start();
            $('#QRVideo').show();
         } else {
            $('#QRVideo').hide();
            $("#ClientScanQRCodeButton").html('Сканировать QR код');
            VideoInScanningProcess = false;
            Scanner.stop();
            Scanner = null;
         }
      }
   });

   $("#TspSendTokensClientButton").click(function () {
      var err_field = $("#SendTokensTxStatus");
      var address = $("#ClientAddress");
      var count   = $("#ClientCount");
      if (
         check_address(address, "Введите адрес Клиента", "Пожалуйста, введите адрес Клиента", err_field) &&
         check_number(count, "Введите количество баллов", "Пожалуйста, введите количество баллов", err_field)
      ) {
         address = address.val();
         count   = new BN(count.val(), 10);
         console.log("Tsp -> Client: " + address + " Count: " + count);
         send_transfer(address, count, err_field, $("#TspSendTokensClientButton"));
      }
   });

   $("#TspScanQRCodeButton").click(function () {
      if (web3_support_qr_scan()) {
         web3.currentProvider
            .scanQRCode()
            .then(data => {
               console.log('QR Scanned:', data);
               data = data.substring(data.indexOf(":") + 1);
               $("#ClientAddress").val(data);
            })
            .catch(err => {
               console.log('Error:', err)
            });
      } else if (VideoCameraSupported) {
         if (!VideoInScanningProcess) {
            VideoInScanningProcess = true;
            $("#TspScanQRCodeButton").html('ОТМЕНИТЬ');
            const video = document.getElementById('QRVideo');
            Scanner = new QrScanner(video, result => {
               console.log('QR Scanned:', result);
               result = result.substring(result.indexOf(":") + 1);
               $("#ClientAddress").val(result);
               $('#QRVideo').hide();
               $("#TspScanQRCodeButton").html('Сканировать QR код');
               VideoInScanningProcess = false;
               Scanner.stop();
               Scanner = null;
            });
            Scanner.start();
            $('#QRVideo').show();
         } else {
            $('#QRVideo').hide();
            $("#TspScanQRCodeButton").html('Сканировать QR код');
            VideoInScanningProcess = false;
            Scanner.stop();
            Scanner = null;
         }
      }
   });

   $("#TspBuyTokensButton").click(function () {
      var err_field = $("#BuyTokensTxStatus");
      var number_of_tokens = $("#TokensToBuy");
      if (check_number(number_of_tokens, "Введите количество баллов", "Пожалуйста, введите количество баллов", err_field)) {
         number_of_tokens = new BN(number_of_tokens.val(), 10);
         send_buy_tokens(number_of_tokens, err_field, $("#TspBuyTokensButton"));
      }
   });

   // Registration
   $("#RegisterTspButton").click(function () {
      var err_field = $("#RegisterTspTxStatus");
      var company_name = $("#company_name");
      if (check_field(company_name, "Введите название компании", "Пожалуйста, введите название комании")) {
         company_name = company_name.val();
         send_tsp_register_request(company_name, err_field, $("#RegisterTspButton"));
      }
   });

   $("#RegisterClientButton").click(function() {
      var err_field = $("#RegisterClientTxStatus");
      var phone = $("#phone");
      if (check_phone(phone, "+7 495 913 7474", "+7 495 913 7474", err_field)) {
         phone = phone.val().replace(/[^0-9]/g, '');
         send_client_register_request(phone, err_field, $("#RegisterClientButton"));
      }
   });

   // Confirm Registration
   $("#BankConfirmRegistrationButton").click(function() {
      var err_field = $("#ConfirmRegistrationTxStatus");
      var application_number = $("#ApplicationNumber");
      var coalition_number = $("#CoalitionNumber");
      if (check_number(application_number, "Введите номер заявки", "Пожалуйста, введите номер заявки", err_field) &&
         check_number(coalition_number, "Введите номер коалиции ТСП", "Пожалуйста, введите номер коалиции ТСП", err_field)) {
         application_number = new BN(application_number.val(), 10);
         coalition_number = new BN(coalition_number.val(), 10);
         send_confirm_registration(application_number - 1, coalition_number, err_field, $("#BankConfirmRegistrationButton"));
      }
   });

   // Демонстрационная функциональность системы
   $("#MakeMeBad").click(function() {
      var err_field = $("#TestAddAdminTxStatus");
      send_test_add_admin(CurrentAccount, err_field, $("#MakeMeBad"));
   });
});
