import React, { useEffect, useState } from 'react';
import './Swap.css';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { erc20ABI, useAccount, useBalance, useContractRead, useContractWrite, useSigner } from 'wagmi'
import AMM from '../artifacts/contracts/AMM.sol/AMM.json';
import { ethers } from 'ethers';
import { Step, StepLabel, Stepper } from '@mui/material';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import TokenSelector from '../components/TokenSelector';
import usePool from '../utils/usePool';

const Swap = () => {
    const { address } = useAccount()
    const signer = useSigner();

    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');

    const [step, setStep] = useState(0);

    const [t1, setT1] = useState({ name: '', address: '' });
    const [t2, setT2] = useState({ name: '', address: '' });
    const [selectingToken, setSelectingToken] = useState(0)

    const pool = usePool(t1.address, t2.address, signer.data);

    const balance = useBalance({
        addressOrName: address,
        token: t1.address
    })

    const allowance = useContractRead({
        addressOrName: t1.address,
        contractInterface: erc20ABI,
        functionName: 'allowance',
        args: [
            address,
            pool
        ]
    })

    //Refetch data if selectedToken is changed
    useEffect(() => {
        balance.refetch();
        allowance.refetch();
        if(t2.address != ''){
            getRate();
        }
    }, [t1])

    const getRate = async () => {
        if (val1 == '' || val1 <= 0) return;
        setVal2('Loading...');

        //If no pool, return
        if(pool == ethers.constants.AddressZero){
            setVal2('No pool found');
            return;
        }

        const amm = new ethers.Contract(pool, AMM.abi, signer.data);
        const amount = ethers.utils.parseEther(val1.toString())

        //Calc direction TODO CHECK IF RIGHT
        const t1address = await amm.token1();

        const rate = await amm.expectOut(amount, t1address == t1.address);
        console.log(rate);
        setVal2(ethers.utils.formatEther(rate));
    }

    const handleSwap = async () => {
        if (val1 == '' || val1 <= 0) return;
        setStep(1);
        const amm = new ethers.Contract(pool, AMM.abi, signer.data);
        const token1 = new ethers.Contract(t1.address, erc20ABI, signer.data);

        const amount = ethers.utils.parseEther(val1.toString())

        console.log('Amount', amount.toString());

        //Check if have to approve
        if (allowance.data.lt(amount)) {
            console.log('Need to approve. Allowance: ', allowance.data.toString());
            const tx = await token1.approve(pool, amount);
            await tx.wait()
            console.log(tx);
        }

        setStep(2);

        //Swap
        const tx = await amm.swap(ethers.utils.parseEther(val1), ethers.utils.parseEther(val2), true);
        setStep(3);
        await tx.wait();
        console.log(tx);

        //TODO check if swap was succesfull, else return to step0
        setStep(4);
    }

    const swapTokens = () => {
        setT1(t2);
        setT2(t1);
    }

    return (
        <div className='body_container'>
            <Paper elevation={3} sx={{ backgroundColor: '#101010' }}>
                <div className='swap_container'>
                    <h3>Swap</h3>
                    <div className='swaps'>
                        <div className="token">
                            <TextField
                                label={'Token 1'}
                                onBlur={getRate}
                                error={val1 != '' && balance.data.value.lte(ethers.BigNumber.from(val1.toString()))}
                                helpertext={val1 != '' && balance.data.value.lte(ethers.BigNumber.from(val1.toString())) ? 'Not enough balance' : ''}
                                type='number'
                                value={val1}
                                onChange={e => { setVal1(e.target.value); setStep(0); }}
                                sx={{ backgroundColor: '#202020' }}
                                fullWidth
                            >
                            </TextField>
                            <div
                                className="token_select"
                                onClick={() => setSelectingToken(1)}
                            >
                                {t1.name || 'Select'}
                                <ArrowDropDown />
                            </div>
                        </div>
                        <div className='arrow_container' onClick={swapTokens}>
                            <ArrowDownwardIcon sx={{ color: 'white' }} />
                        </div>
                        <div className="token">
                            <TextField
                                label={'Token 2'}
                                //type='number'
                                value={val2}
                                //onChange={e => setVal2(e.target.value)}
                                sx={{ backgroundColor: '#202020' }}
                                fullWidth
                            ></TextField>
                            <div
                                className="token_select"
                                onClick={() => setSelectingToken(2)}
                            >
                                {t2.name || 'Select'}
                                <ArrowDropDown />
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSwap} variant='contained' fullWidth sx={{ marginTop: '5px' }}>SWAP</Button>
                </div>
            </Paper>
            <div className='stepper'>
                <h3>Swap steps:</h3>
                <Stepper orientation='vertical' activeStep={step}>
                    <Step key={0}>
                        <StepLabel>
                            Initiate swap
                        </StepLabel>
                    </Step>
                    <Step key={1}>
                        <StepLabel>
                            Approve necessary ERC20
                        </StepLabel>
                    </Step>
                    <Step key={2}>
                        <StepLabel>
                            Approve swap
                        </StepLabel>
                    </Step>
                    <Step key={3}>
                        <StepLabel>
                            {step == 3 ? 'Swapping' : 'Swapped!'}
                        </StepLabel>
                    </Step>
                </Stepper>
            </div>
            {selectingToken != 0 && <TokenSelector
                setSelectingToken={setSelectingToken}
                selectingToken={selectingToken}
                setT1={setT1}
                setT2={setT2}
                t1={t1}
                t2={t2}
            />}
        </div>
    )
}

export default Swap;