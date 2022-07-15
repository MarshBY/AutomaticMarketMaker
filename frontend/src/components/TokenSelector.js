import { Backdrop, Paper, ClickAwayListener, TextField, Button } from "@mui/material";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { erc20ABI, useProvider, useSigner } from "wagmi";
import { addToken, getTokenList } from "../utils/list";
import './TokenSelector.css';

const TokenSelector = (props) => {

    const signer = useSigner();

    const provider = useProvider();

    const [address, setAddress] = useState('');
    const [correct, setCorrect] = useState('');
    const [name, setName] = useState('');

    const [tokens, setTokens] = useState([]);
    const [selected, setSelected] = useState(-1);

    const checkAddress = async () => {
        if (address == '') {
            setCorrect('');
            return;
        }

        setSelected(-1);

        try {
            ethers.utils.getAddress(address);
            setCorrect('');
        } catch (err) {
            setCorrect('Wrong Address');
            return;
        }

        //Check if its a contract??

        const contract = new ethers.Contract(address, erc20ABI, signer.data)

        try {
            const name = await contract.name();
            await contract.balanceOf(await signer.data.getAddress()); //Extra check
            //`console.log("Name", name);
            //const symbol = await contract.symbol();
            //console.log("Symbol", symbol);
            setName(name);
        } catch (err) {
            setCorrect('Address not ERC20');
        }
    }

    const handleConfirm = async () => {

        let tname = '';
        let taddress = ''

        if(selected != -1) {
            tname = tokens[selected].name;
            taddress = tokens[selected].address;
        }else{
            if (correct != '') return;
            if (address == '') {
                setCorrect('Please add an address');
                return;
            }
            taddress = address;
            tname = name;
            addToken({address: taddress, name: tname})
        }


        if (props.selectingToken == 1) {
            if (props.t2.address == taddress) {
                setCorrect('Cannot be same as second token');
                return;
            }

            props.setT1({
                name: tname,
                address: taddress
            })
        } else {
            if (props.t1.address == taddress) {
                setCorrect('Cannot be same as first token');
                return;
            }

            props.setT2({
                name: tname,
                address: taddress
            })
        }

        props.setSelectingToken(0);
    }

    const handleSelect = (i) => {
        setSelected(i);
        setAddress('');
        setName('');
        setCorrect('');
    }

    useEffect(() => {
        const a = async () => {
            setTokens(await getTokenList(provider));
        }
        a();
    }, [])

    return (
        <Backdrop open sx={{ zIndex: '100' }}>
            <ClickAwayListener onClickAway={() => props.setSelectingToken(0)}>
                <div className="body_container">
                    <Paper elevation={3} sx={{ backgroundColor: '#151515' }}>
                        <div className="liquidity_container">
                            <h3>Choose Token</h3>
                            <div className="token_selector_container">
                                {tokens.length > 0 && tokens.map((token, i) =>
                                    <div key={i} className={'token_selector' + (selected==i ? ' selected' : '')} onClick={() => handleSelect(i)}>
                                        {token.name}
                                    </div>
                                )}
                            </div>
                            <h3>Add Token</h3>
                            <TextField
                                label='Token address'
                                value={address}
                                onChange={e => { setAddress(e.target.value); setName('') }}
                                onBlur={checkAddress}
                                error={correct != ''}
                                helperText={correct}
                            ></TextField>
                            {name != '' && <h4>Name: {name}</h4>}
                            <Button
                                //disabled={correct != ''}
                                variant="contained"
                                onClick={handleConfirm}
                                fullWidth
                                sx={{marginTop: '10px'}}
                            >{selected != -1 ? 'Confirm' : address == '' ? 'Select or Add' : 'Add'}</Button>
                        </div>
                    </Paper>
                </div>
            </ClickAwayListener>
        </Backdrop>
    )
}

export default TokenSelector;