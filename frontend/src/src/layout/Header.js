import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import './Header.css';

const Header = (props) => {

    return(
        <div className='header_container'>
            <h3>AMM App</h3>
            <div className='header_links'>
                <p onClick={() => props.setTab(0)}>Swap</p>
                <p onClick={() => props.setTab(1)}>Add Liquidity</p>
                <p onClick={() => props.setTab(2)}>Remove Liquidity</p>
                <p onClick={() => props.setTab(3)}>Pool Info</p>
            </div>
            <ConnectButton />
        </div>
    )
}

export default Header;