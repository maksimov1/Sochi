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
