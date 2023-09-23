import Onboard from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'

const injected = injectedModule()

const wallets = [
  injected,
]

const chains = [
  {
    id: '0x1',
    token: 'ETH',
    label: 'Ethereum Mainnet',
    //rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`
  },
]

const appMetadata = {
  name: 'Conectar Wallet BFA',
  description: 'Conecte su wallet y firme para registrar en BFA',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
  ]
}

const onboard = Onboard({
  notify: {
    enabled: false,
  },
  wallets,
  connect: {
    autoConnectLastWallet: true,
    showSidebar: true,
  },
  chains,
  theme: 'system',
  appMetadata
})

export default onboard
