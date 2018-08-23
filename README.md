## Что сделать сразу после клонирования репозитория

1. sudo npm install -g truffle
2. npm install

### Запуск сервера

1. npm run dev

## Как развернуть тестовую среду

1. установить Ganache и запустить его, в настройках выставить порт 8545
2. npm install
3. truffle compile
4. truffle migrate --network development
5. npm run dev
6. в метамаск переключаетесь на Ganache - Custom RPC (http://127.0.0.1:8545)

## Как закинуть контракт на Rinkeby

1. rm -fr ./build
2. truffle compile
3. truffle migrate --network rinkeby

## При обновлении контракта нужно деплоить так

Для того, чтобы закидывался только BlueRuble.sol, так как Migrations.sol вы вряд ли меняли.

1. truffle migrate -f 2 --network \<network\>
 
## Чтобы в тестовой сети взаимодействовать с контрактом

Сначала надо сделать migrate, как описано было выше а после

1. truffle console

```
truffle(development)> web3.eth.accounts
[ '0x095aa184d23618952345da15b8c3c8b60eedbe40',
  '0xa8022a2f86053e3bad211293fc1cda525f1a3f67',
  '0x69c1368e3e1f8c3f73c7a3d6c371521514bd7874',
  '0x6aaf427fe331b16e21190b4993c64b1459b8e4c4',
  '0xbeda851526913825c3838c2e53becbde7a9e2f52',
  '0xc6023b42d86d0ae27c86b6ccb3a5b108b8586999',
  '0x70cc609c872bf16808b3e6fb2a3cd5fbc581f83b',
  '0xb640afef39d3fcac482cce35801995966d835685',
  '0x820e3020576eceb39e8dc5e86ed0695538fbc967',
  '0x666e86e23d33af096ec2eda8d2f6c97344dad5a4' ]
truffle(development)> web3.eth.accounts[0]
'0x095aa184d23618952345da15b8c3c8b60eedbe40'
truffle(development)> main_account = web3.eth.accounts[0]
'0x095aa184d23618952345da15b8c3c8b60eedbe40'
truffle(development)> BlueRuble.deployed().then(inst => { blur = inst })
undefined
```

Просто используете вызовы web3.
