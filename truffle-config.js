// Allows us to use ES6 in our migrations and tests.
require('babel-register')

var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = 'laundry length release immense soda situate weather chef summer must coyote problem';

module.exports = {
   solc: {
      optimizer: {
         enabled: true,
         runs: 200
      }
   },
   networks: {
      development: {
         host: '127.0.0.1',
         port: 8545,
         network_id: '*' // Match any network id
      },
      rinkeby: {
         // must be a thunk, otherwise truffle commands may hang in CI
         provider: () =>
            new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/c59dfab1f98f48548edfe852e96ce9b6"),
         network_id: '3',
      }
   }
}
