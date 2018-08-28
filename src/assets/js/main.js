import breakpoints from './../vendor/breakpoints.min.js';
import browser from './../vendor/browser.min.js';
import './../vendor/jquery.scrollex.min.js';
import './../vendor/jquery.scrolly.min.js';
import './util.js';

import QRious from 'qrious';

import '../sass/main.scss';

import BlurContractDesc from '../../../build/contracts/BlueRuble.json';

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

var Blur;
var Account;
var Balance;

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

async function update_account() {
   var accs = await web3.eth.getAccounts();
   if (accs[0] !== Account) {
      Account = accs[0];
      Blur.options.from = Account;
      Balance = await web3.eth.getBalance(Account);
      update_info_panel();
      console.log("New account: " + Account);
      console.log("New balance: " + Balance);
   }
}

async function update_info_panel() {

   $("#current_balance").html('');
   $("#current_token_price").html('');

   var cur_account = Account;
   var role = await check_role(cur_account);

   if (role == Role.CLIENT || role == Role.TSP) {
      var balance = await balance_of(cur_account);
      $("#current_balance").html("Ваши баллы: " + balance);
   }

   if (role == Role.TSP || role == Role.ADMIN) {
      var price = await price_per_token();
      $("#current_token_price").html("Стоимость: " + price);
   }

   if ($('#qrious').length) {
      window.qr.value = cur_account;
   }
}

function is_ciper() {
   return !!window.__CIPHER__;
}

function can_scan_qr_code() {
   return !!(
      window.web3 &&
      window.web3.currentProvider &&
      window.web3.currentProvider.scanQRCode
   );
}

function init_page() {

   if (can_scan_qr_code()) {
      $('#ClientScanQRCodeButton').prop("disabled", false);
      $('#TspScanQRCodeButton').prop("disabled", false);
   }

   if ($('#qrious').length) {
      window.qr = new QRious({
         element: document.getElementById('qrious'),
         level: 'Q',
         size: 250,
         value: Account
      });
   }
}

async function init_contract() {
   await load_contract();

   var accs = await web3.eth.getAccounts();
   Account = accs[0];
   Blur.options.from = Account;

   setInterval(function() {
      update_account();
   }, 100);

   init_page();

   update_info_panel();

   return Account;
}


async function get_owner() {
   var owner = await Blur.methods.owner().call();
   console.log("Contract Owner: " + owner);
   return owner;
}

async function balance_of(addr) {
   var balance = await Blur.methods.balanceOf(addr).call();
   console.log("Balance of addr: " + addr + " balance: " + balance);
   return balance;
}

async function check_role(addr) {
   var role = await Blur.methods.checkRole(addr).call();
   console.log("Role of addr: " + addr + " role: " + RoleToText[role]);
   return role;
}

async function get_total_amount() {
   var total = await Blur.methods.totalSupply().call();
   console.log("Total number of tokens: " + total);
   return total;
}

async function price_per_token() {
   var price = await Blur.methods.pricePerToken().call();
   console.log("Price per token: " + price);
   return price;
}

async function min_payment() {
   var min = await Blur.methods.minPayment().call();
   console.log("Min payment: " + min);
   return min;
}

function status_receipt(label) {
   return function(receipt) { label.text("Статус: Началась обработка") };
}

function status_confirmation(label) {
   return function(number, receipt) {
      if (number == 3) {
         update_info_panel();
      }
      if (number <= 12) {
         label.text("Статус: Получено подтверждение (" + number + ")");
      } else if (number == 13) {
         label.text("Статус: Операция успешно завершена");
      } else if (number == 14) {
         label.text('');
      }
   }
}

function status_error(label) {
   return function(error) {
      console.log(error);
      label.text("Ошибка: " + error.message);
   }
}


async function send_test_add_admin(addr, label) {
   return Blur.methods.testAddAdmin(addr).send()
      .on('receipt', status_receipt(label))
      .on('confirmation', status_confirmation(label))
      .on('error', status_error(label));
}

async function send_client_register_request(phone, label) {
   return Blur.methods.sendRegClientRequest(phone).send()
      .on('receipt', status_receipt(label))
      .on('confirmation', status_confirmation(label))
      .on('error', status_error(label));
}

async function send_tsp_register_request(name, label) {
   return Blur.methods.sendRegTSPRequest(name).send()
      .on('receipt', status_receipt(label))
      .on('confirmation', status_confirmation(label))
      .on('error', status_error(label));
}

async function send_confirm_registration(application_number, coalition_number, label) {
   console.log("Confirm request: " + application_number);
   return Blur.methods.applyRegRequest(application_number, coalition_number).send()
      .on('receipt', status_receipt(label))
      .on('confirmation', status_confirmation(label))
      .on('error', status_error(label));
}

async function send_new_token_price(new_price, label) {
   return Blur.methods.changePrice(new_price).send()
      .on('receipt', status_receipt(label))
      .on('confirmation', status_confirmation(label))
      .on('error', status_error(label));
}

async function send_transfer(to_addr, value, label) {
   return Blur.methods.transfer(to_addr, value).send()
      .on('receipt', status_receipt(label))
      .on('confirmation', status_confirmation(label))
      .on('error', status_error(label));
}

async function send_buy_tokens(num, label) {
   var price = await price_per_token();
   var total_price = num * price;

   console.log("Tsp -> Bank: wants to buy " + num + " tokens by price " + price + " Total: " + total_price);

   return web3.eth.sendTransaction({from: Account, to: Blur.options.address, value: total_price.toString()})
      .on('receipt', status_receipt(label))
      .on('confirmation', status_confirmation(label))
      .on('error', status_error(label));
}


function isEmpty(str) {
   return (!str || 0 === str.length);
}

function isNumeric(num) {
  return !isNaN(num)
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
      err_label.text("Пожалуйста введите корректный номер телефона");
      return false;
   } else {
      phone.attr('placeholder', def_placeholder);
      return true;
   }
}


(function($) {

   var	$window = $(window),
      $body = $('body'),
      $wrapper = $('#wrapper'),
      $header = $('#header'),
      $banner = $('#banner');

   // Breakpoints.
   breakpoints({
      xlarge:    ['1281px',   '1680px'   ],
      large:     ['981px',    '1280px'   ],
      medium:    ['737px',    '980px'    ],
      small:     ['481px',    '736px'    ],
      xsmall:    ['361px',    '480px'    ],
      xxsmall:   [null,       '360px'    ]
   });

   /**
    * Applies parallax scrolling to an element's background image.
    * @return {jQuery} jQuery object.
    */
   $.fn._parallax = (browser.name == 'ie' || browser.name == 'edge' || browser.mobile) ? function() { return $(this) } : function(intensity) {

      var	$window = $(window),
         $this = $(this);

      if (this.length == 0 || intensity === 0)
         return $this;

      if (this.length > 1) {

         for (var i=0; i < this.length; i++)
            $(this[i])._parallax(intensity);

         return $this;

      }

      if (!intensity)
         intensity = 0.25;

      $this.each(function() {

         var $t = $(this),
            on, off;

         on = function() {

            $t.css('background-position', 'center 100%, center 100%, center 0px');

            $window
               .on('scroll._parallax', function() {

                  var pos = parseInt($window.scrollTop()) - parseInt($t.position().top);

                  $t.css('background-position', 'center ' + (pos * (-1 * intensity)) + 'px');

               });

         };

         off = function() {

            $t
               .css('background-position', '');

            $window
               .off('scroll._parallax');

         };

         breakpoints.on('<=medium', off);
         breakpoints.on('>medium', on);

      });

      $window
         .off('load._parallax resize._parallax')
         .on('load._parallax resize._parallax', function() {
            $window.trigger('scroll');
         });

      return $(this);

   };

   // Play initial animations on page load.
   $window.on('load', function() {
      window.setTimeout(function() {
         $body.removeClass('is-preload');
      }, 100);
   });

   // Clear transitioning state on unload/hide.
   $window.on('unload pagehide', function() {
      window.setTimeout(function() {
         $('.is-transitioning').removeClass('is-transitioning');
      }, 250);
   });

   // Fix: Enable IE-only tweaks.
   if (browser.name == 'ie' || browser.name == 'edge')
      $body.addClass('is-ie');

   // Scrolly.
   $('.scrolly').scrolly({
      offset: function() {
         return $header.height() - 2;
      }
   });

   // Tiles.
   var $tiles = $('.tiles > article');

   $tiles.each(function() {

      var $this = $(this),
         $image = $this.find('.image'), $img = $image.find('img'),
         $link = $this.find('.link'),
         x;

      // Image.

      // Set image.
      $this.css('background-image', 'url(' + $img.attr('src') + ')');

      // Set position.
      if (x = $img.data('position'))
         $image.css('background-position', x);

      // Hide original.
      $image.hide();

      // Link.
      if ($link.length > 0) {

         var $x = $link.clone()
            .text('')
            .addClass('primary')
            .appendTo($this);

         $link = $link.add($x);

         $link.on('click', function(event) {

            var href = $link.attr('href');

            // Prevent default.
            event.stopPropagation();
            event.preventDefault();

            // Target blank?
            if ($link.attr('target') == '_blank') {

               // Open in new tab.
               window.open(href);

            }

            // Otherwise ...
            else {

               // Start transitioning.
               $this.addClass('is-transitioning');
               $wrapper.addClass('is-transitioning');

               // Redirect.
               window.setTimeout(function() {
                  location.href = href;
               }, 500);

            }

         });

      }

   });

   // Header.
   if ($banner.length > 0
      &&	$header.hasClass('alt')) {

      $window.on('resize', function() {
         $window.trigger('scroll');
      });

      $window.on('load', function() {

         $banner.scrollex({
            bottom:		$header.height() + 10,
            terminate:	function() { $header.removeClass('alt'); },
            enter:		function() { $header.addClass('alt'); },
            leave:		function() { $header.removeClass('alt'); $header.addClass('reveal'); }
         });

         window.setTimeout(function() {
            $window.triggerHandler('scroll');
         }, 100);

      });

   }

   // Banner.
   $banner.each(function() {

      var $this = $(this),
         $image = $this.find('.image'), $img = $image.find('img');

      // Parallax.
      $this._parallax(0.275);

      // Image.
      if ($image.length > 0) {

         // Set image.
         $this.css('background-image', 'url(' + $img.attr('src') + ')');

         // Hide original.
         $image.hide();

      }

   });

   // Menu.
   var $menu = $('#menu'),
      $menuInner;

   $menu.wrapInner('<div class="inner"></div>');
   $menuInner = $menu.children('.inner');
   $menu._locked = false;

   $menu._lock = function() {

      if ($menu._locked)
         return false;

      $menu._locked = true;

      window.setTimeout(function() {
         $menu._locked = false;
      }, 350);

      return true;

   };

   $menu._show = function() {

      if ($menu._lock())
         $body.addClass('is-menu-visible');

   };

   $menu._hide = function() {

      if ($menu._lock())
         $body.removeClass('is-menu-visible');

   };

   $menu._toggle = function() {

      if ($menu._lock())
         $body.toggleClass('is-menu-visible');

   };

   $menuInner
      .on('click', function(event) {
         event.stopPropagation();
      })
      .on('click', 'a', function(event) {

         var href = $(this).attr('href');

         event.preventDefault();
         event.stopPropagation();

         // Hide.
         $menu._hide();

         // Redirect.
         window.setTimeout(function() {
            window.location.href = href;
         }, 250);

      });

   $menu
      .appendTo($body)
      .on('click', function(event) {

         event.stopPropagation();
         event.preventDefault();

         $body.removeClass('is-menu-visible');

      })
      .append('<a class="close" href="#menu">Close</a>');

   $body
      .on('click', 'a[href="#menu"]', function(event) {

         event.stopPropagation();
         event.preventDefault();

         // Toggle.
         $menu._toggle();

      })
      .on('click', function(event) {

         // Hide.
         $menu._hide();

      })
      .on('keydown', function(event) {

         // Hide on escape.
         if (event.keyCode == 27)
            $menu._hide();

      });

   // Test Web3 Loading
   $window.on('load', function() {
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
      console.log("Web3 version: " + web3.version);

      init_contract();


      $("#BankChangeTokenPriceButton").click(function () {
         var err_field = $("#PriceChangeTxStatus");
         var new_price = $("#NewTokenPrice");
         if (
             check_field(new_price, "Введите новую цену токена", "Пожалуйста, Введите новую цену токена")
         ) {
            new_price = new_price.val().replace(/[^0-9]/g, '');
            console.log("New Token Price: " + new_price);
            send_new_token_price(new_price, err_field);
         }
      });

      $("#ClientSendTokensButton").click(function () {
         var err_field = $("#SendTokensTxStatus");
         var address = $("#TspClientAddress");
         var count   = $("#TokenCount");
         if (
             check_field(address, "Введите адрес ТСП/Клиента", "Пожалуйста, Введите адрес ТСП/Клиента") &&
             check_field(count, "Введите количество баллов", "Пожалуйста, Введите количество баллов")
         ) {
            address = address.val();
            count = count.val();
            console.log("Client -> Tsp: " + address + " Count: " + count);
            balance_of(Account);
            send_transfer(address, count, err_field);
         }
      });

      $("#ClientScanQRCodeButton").click(function () {
         web3.currentProvider
            .scanQRCode()
            .then(data => {
               console.log('QR Scanned:', data)
               $("#TspClientAddress").val(data);
            })
            .catch(err => {
               console.log('Error:', err)
            });
      });

      $("#TspSendTokensClientButton").click(function () {
         var err_field = $("#SendTokensTxStatus");
         var address = $("#ClientAddress");
         var count   = $("#ClientCount");
         if (
             check_field(address, "Введите адрес Клиента", "Пожалуйста, Введите адрес ТСП") &&
             check_field(count, "Введите количество баллов", "Пожалуйста, Введите количество баллов")
         ) {
            address = address.val();
            count   = count.val();
            console.log("Tsp -> Client: " + address + " Count: " + count);
            balance_of(Account);
            send_transfer(address, count, err_field);
         }
      });

      $("#TspScanQRCodeButton").click(function () {
         web3.currentProvider
            .scanQRCode()
            .then(data => {
               console.log('QR Scanned:', data)
               $("#ClientAddress").val(data);
            })
            .catch(err => {
               console.log('Error:', err)
            });
      });

      $("#TspBuyTokensButton").click(function () {
         var err_field = $("#BuyTokensTxStatus");
         var number_of_tokens = $("#TokensToBuy");
         if (check_field(number_of_tokens, "Введите количество токенов", "Пожалуйста, Введите количество токенов")) {
            number_of_tokens = number_of_tokens.val().replace(/[^0-9]/g, '');
            send_buy_tokens(number_of_tokens, err_field);
         }
      });

      // Registration
      $("#RegisterTspButton").click(function () {
         var err_field = $("#RegisterTspTxStatus");
         var company_name = $("#company_name");
         if (check_field(company_name, "Введите номер название компании", "Пожалуйста, Введите название комании")) {
            company_name = company_name.val();
            send_tsp_register_request(company_name, err_field);
         }
      });

      $("#RegisterClientButton").click(function() {
         var err_field = $("#RegisterClientTxStatus");
         var phone = $("#phone");
         if (check_phone(phone, "+7 495 913 7474", "+7 495 913 7474", err_field)) {
            phone = phone.val().replace(/[^0-9]/g, '');
            send_client_register_request(phone, err_field);
         }
      });

      // Confirm Registration
      $("#BankConfirmRegistrationButton").click(function() {
         var err_field = $("#ConfirmRegistrationTxStatus");
         var application_number = $("#ApplicationNumber");
         var coalition_number = 0;
         if (check_field(application_number, "Введине номер заявки", "Пожалуйста, Введите номер заявки")) {
            application_number = application_number.val().replace(/[^0-9]/g, '');
            send_confirm_registration(application_number - 1, coalition_number, err_field);
         }
      });

      // Демонстрационная функциональность системы
      $("#MakeMeBad").click(function() {
         var err_field = $("#TestAddAdminTxStatus");
         send_test_add_admin(Account, err_field);
      });
   });
})(jQuery);
