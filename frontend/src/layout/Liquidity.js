import { Button, Paper, TextField } from "@mui/material";
import './Liquidity.css';
import { useEffect, useState } from 'react';
import { ethers } from "ethers";
import constants from "../constants";
import { useSigner, useBalance, useAccount, erc20ABI, useContractRead } from "wagmi";
import AMM from '../artifacts/contracts/AMM.sol/AMM.json';
import AMMFactory from '../artifacts/contracts/AMMFactory.sol/AMMFactory.json';
import { Step, StepLabel, Stepper } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import TokenSelector from "../components/TokenSelector";
import usePool from '../utils/usePool';

const Liquidity = () => {

    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');

    const [step, setStep] = useState(0);

    const signer = useSigner();

    const { address } = useAccount();

    const [t1, setT1] = useState({ name: '', address: '' });
    const [t2, setT2] = useState({ name: '', address: '' });
    const pool = usePool(t1.address, t2.address, signer.data);

    const [selectingToken, setSelectingToken] = useState(0);

    const { data: bal1 } = useBalance({
        addressOrName: address,
        token: t1.address
    })

    const { data: bal2 } = useBalance({
        addressOrName: address,
        token: t2.address
    })

    const allowance1 = useContractRead({
        addressOrName: t1.address,
        contractInterface: erc20ABI,
        functionName: 'allowance',
        args: [
            address,
            //constants.contract
            pool
        ]
    })

    const allowance2 = useContractRead({
        addressOrName: t2.address,
        contractInterface: erc20ABI,
        functionName: 'allowance',
        args: [
            address,
            //constants.contract
            pool
        ]
    })

    const checkRequired = async () => {
        if(pool == ethers.constants.AddressZero) return;
        
        if (val1 == '' || val1 <= 0) return;
        const contract = new ethers.Contract(pool, AMM.abi, signer.data);
        
        //Return if no liquidity
        if (await contract.totalSupply() == 0) return;
        
        //Check direction of requiredAmount():
        const token1 = await contract.token1();
        
        console.log('Direction ', token1==t1.address);
        
        const req = await contract.requiredAmount(ethers.utils.parseEther(val1.toString()), token1==t1.address);
        
        console.log(req);
        setVal2(ethers.utils.formatEther(req));
    }
    
    const createPool = async () => {
        const contract = new ethers.Contract(constants.contract, AMMFactory.abi, signer.data);

        const tx = await contract.createPool(t1.address, t2.address);
        const receipt = await tx.wait();

        const newPool = ethers.utils.defaultAbiCoder.decode(['address'], receipt.logs[0].topics[1])[0] 
        console.log('New Pool address', newPool);

        //Add liquidity
        //setPool(newPool);
        addLiq(newPool)
        /*
        const newPoolContract = new ethers.Contract(newPool, AMM.abi, signer.data);

        const amnt1 = ethers.utils.parseEther(val1.toString());
        const amnt2 = ethers.utils.parseEther(val2.toString());
    
        const liqTx = await newPoolContract.addLiquidity(amnt1, amnt2);
        console.log(await liqTx.wait());
        */
    }

    const addLiq = async (newPoolAddress) => {
        let poolAddress;

        //To be able to use when creating Pool without having to wait on React hooks
        if(newPoolAddress) {
            poolAddress = newPoolAddress
        }else{
            poolAddress = pool;
        }

        const amnt1 = ethers.utils.parseEther(val1.toString());
        const amnt2 = ethers.utils.parseEther(val2.toString());
        
        console.log('Amounts: ', amnt1.toString(), amnt2.toString())
        console.log('Balances: ', bal1.value.toString(), bal2.value.toString())
        console.log('Allowances: ', allowance1.data.toString(), allowance2.data.toString())
        
        if (amnt1.gt(bal1.value) || amnt2.gt(bal2.value)) {
            console.log('Not enough balance');
            return;
        }
        
        if (allowance1.data.lt(amnt1)) {
            console.log('Approve 1');
            const token = new ethers.Contract(t1.address, erc20ABI, signer.data);

            console.log('ChaindId', await signer.data.getChainId());
            
            const tx = await token.approve(poolAddress, amnt1);
            await tx.wait();
            console.log(tx);
        }
        
        if (allowance2.data.lt(amnt2)) {
            console.log('Approve 2');
            const token = new ethers.Contract(t2.address, erc20ABI, signer.data);
            
            const tx = await token.approve(poolAddress, amnt2);
            await tx.wait();
            console.log(tx);
        }
        
        setStep(2);

        const contract = new ethers.Contract(poolAddress, AMM.abi, signer.data);
        
        //Check direction for amounts
        const token1 = await contract.token1();

        let tx;
        if(token1 == t1.address) {
            tx = await contract.addLiquidity(amnt1, amnt2);
        }else {
            tx = await contract.addLiquidity(amnt2, amnt1);
        }
        setStep(3);
        await tx.wait();
        console.log(tx);
        
        //TODO check tx passed
        setStep(4);
    }
    
    const handleAddLiq = async () => {
        if (val1 == '' || val1 <= 0 || val2 == '' || val2 <= 0) return;

        //If pool doesn't exist, create it
        if(pool == ethers.constants.AddressZero) {
            createPool();
            return;
        }
        setStep(1);

        addLiq();
    }
    
    /*const getPool = async () => {
        const factory = new ethers.Contract(constants.contract, AMMFactory.abi, signer.data);
        
        const pool = await factory.pools(t1.address, t2.address);
        
        console.log('Pool', pool);

        setPool(pool);
    }*/

    useEffect(() => {
        setVal1('')
        setVal2('')
        /*if (t1.address != '' && t2.address != '') {
            getPool();
        }*/
    }, [t1, t2])

    return (
        <div className="body_container">
            <Paper elevation={3} sx={{ backgroundColor: '#151515' }}>
                <div className="liquidity_container">
                    <h3>Add Liquidity</h3>
                    <div className="token">
                        <TextField
                            onBlur={checkRequired}
                            type='number'
                            label='Amount'
                            value={val1}
                            onChange={e => setVal1(e.target.value)}
                            sx={{ backgroundColor: '#202020' }}
                            fullWidth
                        ></TextField>
                        <div className="token_select" onClick={() => setSelectingToken(1)}>
                            {t1.name || 'Select'}
                            <ArrowDropDownIcon />
                        </div>
                    </div>
                    <div className="token">
                        <TextField
                            type='number'
                            label='Amount'
                            value={val2}
                            fullWidth
                            onChange={e => {if(pool == ethers.constants.AddressZero) setVal2(e.target.value)}}
                            sx={{ backgroundColor: '#202020' }}
                        ></TextField>
                        <div className="token_select" onClick={() => setSelectingToken(2)}>
                            {t2.name || 'Select'}
                            <ArrowDropDownIcon />
                        </div>
                    </div>
                    {/*<h4>Pool {pool}</h4>*/}
                    <Button
                        onClick={handleAddLiq}
                        variant="contained"
                        fullWidth
                    >{pool == ethers.constants.AddressZero ? 'Create Pool' : 'Add Liquidity'}</Button>
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
                            {step == 3 ? 'Adding Liquidity' : 'Liqudity Added!'}
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

export default Liquidity;