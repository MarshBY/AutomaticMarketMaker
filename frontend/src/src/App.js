import './App.css';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
} from 'wagmi';
//import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import Header from './layout/Header';
import Swap from './layout/Swap';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useState } from 'react';
import Liquidity from './layout/Liquidity';
import RemoveLiquidity from './layout/RemoveLiquidity';
import PoolInfo from './layout/PoolInfo';

const { chains, provider } = configureChains(
  [/*chain.mainnet,*/ chain.hardhat],
  [
    //infuraProvider({ infuraId: process.env.INFURA_ID }),
    publicProvider()
  ]
);

console.log('ID', process.env.INFURA_ID);

const { connectors } = getDefaultWallets({
  appName: 'My AMM App',
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

//console.log('Client', wagmiClient);

const theme = createTheme({
  palette: {
    primary: {
      main: '#1D858D',
      info: 'rgba(255,255,255,0.77)'
    },
    secondary: {
      main: 'rgba(255,255,255,0.77)'
    },
    text: {
      primary: 'rgba(255,255,255,0.77)',
      secondary: 'rgba(255,255,255,0.77)',
    }
  }
})

const App = () => {

  const [tab, setTab] = useState(0); //0 = Swap, 1 = Liq

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <ThemeProvider theme={theme}>
          <div className='main_container'>
            <Header setTab={setTab} />
            {tab == 0 && <Swap />}
            {tab == 1 && <Liquidity />}
            {tab == 2 && <RemoveLiquidity />}
            {tab == 3 && <PoolInfo />}
          </div>
        </ThemeProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default App;
