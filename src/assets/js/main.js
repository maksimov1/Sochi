import breakpoints from './../vendor/breakpoints.min.js';
import browser from './../vendor/browser.min.js';
import './../vendor/jquery.scrollex.min.js';
import './../vendor/jquery.scrolly.min.js';
import './util.js';

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
}

async function init_contract() {
   await load_contract();

   var accs = await web3.eth.getAccounts();
   Account = accs[0];
   Blur.options.from = Account;

   setInterval(function() {
      update_account();
   }, 100);

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

async function send_client_register_request(phone) {
   return Blur.methods.sendRegRequest(phone, Role.REQ_CLIENT).send()
      .on('receipt', function (receipt) {
         $("#TxStatus").text("Success");
         alert("Success");
      })
      .on('error', function (error) {
         $("#TxStatus").text(error);
         alert("Error");
      });
}

async function send_new_token_price(new_price) {
   // need to update interface
   return Blur.methods.changePrice(new_price).send()
      .on('receipt', function (receipt) {
         $("#TxStatus").text("Success");
         alert("Success");
      })
      .on('confirmation', function(number, receipt) {
         if (number == 1) { // MAYME 12?
            update_info_panel();
         }
      })
      .on('error', function (error) {
         $("#TxStatus").text(error);
         alert("Error");
      });
}

async function send_tsp_register_request(ogrn) {
   return Blur.methods.sendRegRequest(ogrn, Role.REQ_TSP).send()
      .on('receipt', function (receipt) {
         $("#TxStatus").text("Success");
         alert("Success");
      })
      .on('error', function (error) {
         $("#TxStatus").text(error);
         alert("Error");
      });
}

async function send_confirm_registration(application_number) {
   console.log("Confirm request: " + application_number);
   return Blur.methods.applyRegRequest(application_number).send()
      .on('receipt', function (receipt) {
         $("#TxStatus").text("Success");
         alert("Success");
      })
      .on('error', function (error) {
         $("#TxStatus").text(error);
         alert("Error");
      });
}

async function send_transfer(to_addr, value) {
   return Blur.methods.transfer(to_addr, value).send()
      .on('receipt', function (receipt) {
         $("#TxStatus").text("Success");
         alert("Success");
      })
      .on('error', function (error) {
         $("#TxStatus").text(error);
         alert("Error");
      });
}

async function send_buy_tokens(num) {
   var price = await price_per_token();
   var total_price = num * price;

   console.log("Tsp -> Bank: wants to buy " + num + " tokens by price " + price + " Total: " + total_price);

   //value: web3.utils.toWei(total_price.toString(), "ether")
   return web3.eth.sendTransaction({from: Account, to: Blur.options.address, value: web3.utils.toWei(total_price.toString(), "ether")})
      .on('receipt', function (receipt) {
         $("#TxStatus").text("Success");
         alert("Success");
      })
      .on('error', function (error) {
         $("#TxStatus").text(error);
         alert("Error");
      });
}


function isEmpty(str) {
   return (!str || 0 === str.length);
}

function check_field(field, id_field, def_placeholder, err_placeholder) {
   if (isEmpty(field)) {
      $(id_field).attr('placeholder', err_placeholder);
      return false;
   } else {
      $(id_field).attr('placeholder', def_placeholder);
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
         alert("Пожалуйста, установите MetaMask или используйте Toshi на мобильном телефоне.");
         window.web3 = new Web3.providers.HttpProvider('http://localhost:8545');
      }
      web3 = window.web3;
      console.log("Web3 version: " + web3.version);

      init_contract();

      /* Don't needed
      $("#BankSendTokensTspButton").click(function () {
         var address = $("#TspAddress").val();
         var count   = $("#TspCount").val();
         if (
             check_field(address, "#TspAddress", "Введите адрес ТСП", "Пожалуйста, Введите адрес ТСП") &&
             check_field(count, "#TspCount", "Введите количество баллов", "Пожалуйста, Введите количество баллов")
         ) {
            console.log("Bank -> Tsp: " + address + " Count: " + count);
            send_transfer(address, count);
         }
      });
      */

      $("#BankChangeTokenPriceButton").click(function () {
         var new_price = $("#NewTokenPrice").val().replace(/[^0-9]/g, '');
         if (
             check_field(new_price, "#NewTokenPrice", "Введите новую цену токена", "Пожалуйста, Введите новую цену токена")
         ) {
            console.log("New Token Price: " + new_price);
            send_new_token_price(new_price);
         }
      });

      $("#ClientSendTokensTspButton").click(function () {
         var address = $("#TspAddress").val();
         var count   = $("#TspCount").val();
         if (
             check_field(address, "#TspAddress", "Введите адрес ТСП", "Пожалуйста, Введите адрес ТСП") &&
             check_field(count, "#TspCount", "Введите количество баллов", "Пожалуйста, Введите количество баллов")
         ) {
            console.log("Client -> Tsp: " + address + " Count: " + count);
            balance_of(Account);
            send_transfer(address, count);
         }
      });

      $("#TspSendTokensClientButton").click(function () {
         var address = $("#ClientAddress").val();
         var count   = $("#ClientCount").val();
         if (
             check_field(address, "#ClientAddress", "Введите адрес Клиента", "Пожалуйста, Введите адрес ТСП") &&
             check_field(count, "#ClientCount", "Введите количество баллов", "Пожалуйста, Введите количество баллов")
         ) {
            console.log("Tsp -> Client: " + address + " Count: " + count);
            balance_of(Account);
            send_transfer(address, count);
         }
      });

      $("#TspBuyTokensButton").click(function () {
         var number_of_tokens = $("#TokensToBuy").val().replace(/[^0-9]/g, '');
         if (check_field(number_of_tokens, "#TokensToBuy", "Введите количество токенов", "Пожалуйста, Введите количество токенов")) {
            send_buy_tokens(number_of_tokens);
         }
      });

      // Registration
      $("#RegisterTspButton").click(function () {
         var ogrn = $("#ogrn").val().replace(/[^0-9]/g, '');
         if (check_field(ogrn, "#ogrn", "Введите номер ОГРН", "Пожалуйста, Введите номер ОГРН")) {
            send_tsp_register_request(ogrn);
         }
      });

      $("#RegisterClientButton").click(function() {
         var phone = $("#phone").val().replace(/[^0-9]/g, '');
         if (check_field(phone, "#phone", "Введине номер телефона", "Пожалуйста, Введите номер телефона")) {
            send_client_register_request(phone);
         }
      });

      // Confirm Registration
      $("#BankConfirmRegistrationButton").click(function() {
         var application_number = $("#ApplicationNumber").val().replace(/[^0-9]/g, '');
         if (check_field(application_number, "#ApplicationNumber", "Введине номер заявки", "Пожалуйста, Введите номер заявки")) {
            send_confirm_registration(application_number - 1);
         }
      });
   });
})(jQuery);
