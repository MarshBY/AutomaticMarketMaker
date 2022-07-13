import { Button, Paper, TextField } from "@mui/material";
import './RemoveLiquidity.css';
import { useState } from 'react';
import constants from "../constants";
import { useSigner, useBalance, useAccount } from "wagmi";
import AMM from '../AMM.json';
import { ethers } from "ethers";
import { Step, StepLabel, Stepper } from '@mui/material';

const RemoveLiquidity = () => {

    const [lp, setLP] = useState('');
    const [val1, setVal1] = useState(0);
    const [val2, setVal2] = useState(0);

    const [step, setStep] = useState(0);

    const signer = useSigner();

    const { address } = useAccount();

    const { data: bal } = useBalance({
        addressOrName: address,
        token: constants.contract
    })

    const updateAmounts = async () => {
        const contract = new ethers.Contract(constants.contract, AMM.abi, signer.data);
        const ratio = (lp * 100) / await contract.totalSupply();

        setVal1(await contract.reserves1() * ratio / 100);
        setVal2(await contract.reserves2() * ratio / 100);
    }

    const handleRemoveLiq = async () => {
        if (lp == '' || lp <= 0) return;

        setStep(1);

        const contract = new ethers.Contract(constants.contract, AMM.abi, signer.data);

        const total = await contract.totalSupply()
        console.log('LP', ethers.utils.parseEther(lp).toString());
        console.log('TotalS', total.toString());

        const tx = await contract.removeLiquidity(ethers.utils.parseEther(lp));
        setStep(2);
        await tx.wait();
        console.log(tx);

        //TODO check tx right
        setStep(3);
    }

    return (
        <div className="body_container">
            <Paper elevation={3} sx={{ backgroundColor: '#151515' }}>
                <div className="liquidity_container">
                    <h3>Remove Liquidity</h3>
                    <h5>Your LP tokens: {ethers.utils.formatEther(bal.value).toString()}</h5>
                    <div className="token_holder">
                    <TextField onBlur={updateAmounts} fullWidth type='number' label='Tokens to burn' value={lp} onChange={e => {setLP(e.target.value); setStep(0);}} sx={{ marginBottom: '8px', backgroundColor: '#202020' }}></TextField>
                    <Button variant="outlined" sx={{marginLeft:'5px'}} onClick={() => {setLP(ethers.utils.formatEther(bal.value)); updateAmounts();}}>Max</Button>
                    </div>
                    <div className="token_holder">
                        <h5>Token1:</h5>
                        <h5>~ {val1}</h5>
                    </div>
                    <div className="token_holder">
                        <h5>Token2:</h5>
                        <h5>~ {val2}</h5>
                    </div>
                    <Button onClick={handleRemoveLiq} variant="contained" fullWidth>Remove Liquidity</Button>
                </div>
            </Paper>
            <div className='stepper'>
                <h3>Add Liquidity steps:</h3>
                <Stepper orientation='vertical' activeStep={step}>
                    <Step key={0}>
                        <StepLabel>
                            Add LP token amount, Initiate Remove Liquidity
                        </StepLabel>
                    </Step>
                    <Step key={1}>
                        <StepLabel>
                            Approve Remove Liqudity transaction
                        </StepLabel>
                    </Step>
                    <Step key={2}>
                        <StepLabel>
                            {step==2 ? 'Removing Liquidity' : 'Liqudity Removed!'}
                        </StepLabel>
                    </Step>
                </Stepper>
            </div>
        </div>
    )
}

export default RemoveLiquidity;