import { Button, Paper, TextField } from "@mui/material";
import './Liquidity.css';
import { useState } from 'react';
import { ethers } from "ethers";
import constants from "../constants";
import { useSigner, useBalance, useAccount, erc20ABI, useContractRead } from "wagmi";
import AMM from '../AMM.json';
import { Step, StepLabel, Stepper } from '@mui/material';

const Liquidity = () => {

    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');

    const [step, setStep] = useState(0);

    const signer = useSigner();

    const {address} = useAccount();

    const t1 = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const t2 = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

    const {data: bal1} = useBalance({
        addressOrName: address,
        token: t1
    })

    const {data: bal2} = useBalance({
        addressOrName: address,
        token: t2
    })

    const allowance1 = useContractRead({
        addressOrName: t1,
        contractInterface: erc20ABI,
        functionName: 'allowance',
        args: [
            address,
            constants.contract
        ]
    })

    const allowance2 = useContractRead({
        addressOrName: t2,
        contractInterface: erc20ABI,
        functionName: 'allowance',
        args: [
            address,
            constants.contract
        ]
    })

    const checkRequired = async () => {
        if(val1 == '' || val1 <= 0 ) return;
        const contract = new ethers.Contract(constants.contract, AMM.abi, signer.data);
        
        if(await contract.totalSupply() == 0) return;
        
        const req = await contract.requiredAmount(ethers.utils.parseEther(val1.toString()));
        console.log(req);
        setVal2(ethers.utils.formatEther(req));
    }
    
    const handleAddLiq = async () => {
        if(val1 == '' || val1 <= 0 || val2 == '' || val2 <= 0) return;
        setStep(1);
        
        const amnt1 = ethers.utils.parseEther(val1.toString());
        const amnt2 = ethers.utils.parseEther(val2.toString());

        console.log('Amounts: ', amnt1.toString(), amnt2.toString())
        console.log('Balances: ', bal1.value.toString(), bal2.value.toString())
        console.log('Allowances: ', allowance1.data.toString(), allowance2.data.toString())

        if(amnt1.gt(bal1.value) || amnt2.gt(bal2.value)) {
            console.log('Not enough balance');
            return;
        }

        if(allowance1.data.lt(amnt1)) {
            console.log('Approve 1');
            const token = new ethers.Contract(t1, erc20ABI, signer.data);

            console.log('ChaindId', await signer.data.getChainId());

            const tx = await token.approve(constants.contract, amnt1);
            await tx.wait();
            console.log(tx);
        }

        if(allowance2.data.lt(amnt2)) {
            console.log('Approve 2');
            const token = new ethers.Contract(t2, erc20ABI, signer.data);

            const tx = await token.approve(constants.contract, amnt2);
            await tx.wait();
            console.log(tx);
        }

        setStep(2);

        const contract = new ethers.Contract(constants.contract, AMM.abi, signer.data);

        const tx = await contract.addLiquidity(amnt1, amnt2);
        setStep(3);
        await tx.wait();
        console.log(tx);

        //TODO check tx passed
        setStep(4);
    }

    return (
        <div className="body_container">
            <Paper elevation={3} sx={{ backgroundColor: '#151515' }}>
                <div className="liquidity_container">
                    <h3>Add Liquidity</h3>
                    <TextField onBlur={checkRequired} type='number' label='Token 1' value={val1} onChange={e=>setVal1(e.target.value)} sx={{ marginBottom: '8px', backgroundColor: '#202020'}}></TextField>
                    <TextField type='number' label='Token 2' value={val2} onChange={e=>setVal2(e.target.value)} sx={{ marginBottom: '8px', backgroundColor: '#202020'}}></TextField>
                    <Button onClick={handleAddLiq} variant="contained" fullWidth>Add Liquidity</Button>
                </div>
            </Paper>
            <div className='stepper'>
                <h3>Add Liquidity steps:</h3>
                <Stepper orientation='vertical' activeStep={step}>
                    <Step key={0}>
                        <StepLabel>
                            Add token amount, Initiate Add Liquidity
                        </StepLabel>
                    </Step>
                    <Step key={1}>
                        <StepLabel>
                            Approve necessary ERC20
                        </StepLabel>
                    </Step>
                    <Step key={2}>
                        <StepLabel>
                            Approve Add Liquidity transaction
                        </StepLabel>
                    </Step>
                    <Step key={3}>
                        <StepLabel>
                            {step==3 ? 'Adding Liquidity' : 'Liqudity Added!'}
                        </StepLabel>
                    </Step>
                </Stepper>
            </div>
        </div>
    )
}

export default Liquidity;