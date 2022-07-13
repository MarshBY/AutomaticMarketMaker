import React, { useEffect, useState } from 'react';
import './Swap.css';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { erc20ABI, useAccount, useBalance, useContractRead, useContractWrite, useSigner } from 'wagmi'
import constants from '../constants';
import AMM from '../AMM.json';
import { ethers } from 'ethers';
import { Step, StepLabel, Stepper } from '@mui/material';

const Swap = () => {
    const { address } = useAccount()

    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');

    const [step, setStep] = useState(0);

    const selectedToken = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    const balance = useBalance({
        addressOrName: address,
        token: selectedToken
    })

    const allowance = useContractRead({
        addressOrName: selectedToken,
        contractInterface: erc20ABI,
        functionName: 'allowance',
        args: [
            address,
            constants.contract
        ]
    })

    const signer = useSigner();

    //Refetch data if selectedToken is changed
    useEffect(() => {
        balance.refetch();
        allowance.refetch();
    }, [selectedToken])

    //useEffect(() => {
    //    getRate();
    //}, [val1])

    const getRate = async () => {
        if (val1 == '' || val1 <= 0) return;
        setVal2('Loading...');
        console.log('Getting rate');
        const amm = new ethers.Contract(constants.contract, AMM.abi, signer.data);

        const amount = ethers.utils.parseEther(val1.toString())

        const rate = await amm.expectOut(amount, true);
        console.log(rate);
        setVal2(ethers.utils.formatEther(rate));
    }

    const handleSwap = async () => {
        if (val1 == '' || val1 <= 0) return;
        setStep(1);
        const amm = new ethers.Contract(constants.contract, AMM.abi, signer.data);
        const token1 = new ethers.Contract(selectedToken, erc20ABI, signer.data);

        const amount = ethers.utils.parseEther(val1.toString())

        console.log('Amount', amount.toString());

        //Check if have to approve
        if (allowance.data.lt(amount)) {
            console.log('Need to approve. Allowance: ', allowance.data.toString());
            const tx = await token1.approve(constants.contract, amount);
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

    return (
        <div className='body_container'>
            <Paper elevation={3} sx={{ backgroundColor: '#101010' }}>
                <div className='swap_container'>
                    <h3>Swap</h3>
                    <div className='swaps'>
                        <TextField
                            label={'Token 1'}
                            onBlur={getRate}
                            error={val1 != '' && balance.data.value.lte(ethers.BigNumber.from(val1.toString()))}
                            helpertext={val1 != '' && balance.data.value.lte(ethers.BigNumber.from(val1.toString())) ? 'Not enough balance' : ''}
                            type='number'
                            value={val1}
                            onChange={e => {setVal1(e.target.value); setStep(0);}}
                            sx={{ marginBottom: '3px', backgroundColor: '#202020' }}
                        >
                        </TextField>
                        {/*
                            <div style={{position:'absolute', backgroundColor:'red', right:'10px'}}>
                                Select Token
                            </div>
                        */}
                        <div className='arrow_container'>
                            <ArrowDownwardIcon sx={{ color: 'white' }} />
                        </div>
                        <TextField
                            label={'Token 2'}
                            //type='number'
                            value={val2}
                            //onChange={e => setVal2(e.target.value)}
                            sx={{ marginBottom: '3px', backgroundColor: '#202020' }}
                        ></TextField>
                    </div>
                    <Button onClick={handleSwap} variant='contained' fullWidth sx={{ marginTop: '10px' }}>SWAP</Button>
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
                            {step==3 ? 'Swapping' : 'Swapped!'}
                        </StepLabel>
                    </Step>
                </Stepper>
            </div>
        </div>
    )
}

export default Swap;