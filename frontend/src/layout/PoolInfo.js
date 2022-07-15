import { ethers } from "ethers";
import { erc20ABI, useBalance, useSigner } from "wagmi";
import constants from "../constants";
import AMM from '../artifacts/contracts/AMM.sol/AMM.json';
import { useEffect, useState } from "react";
import { Paper } from "@mui/material";
import PoolChooser from "../components/PoolChooser";

const PoolInfo = () => {

    const [pool, setPool] = useState('');
    const [t1, setT1] = useState({name: '', address: ''});
    const [t2, setT2] = useState({name: '', address: ''});

    const [totalSupply, setTotalSupply] = useState();

    const signer = useSigner();

    const bal1 = useBalance({
        addressOrName: pool,
        token: t1.address
    })

    const bal2 = useBalance({
        addressOrName: pool,
        token: t2.address
    })

    const updateInfo = async () => {
        const contract = new ethers.Contract(pool, AMM.abi, signer.data);

        try{
            const ts = await contract.totalSupply();
            setTotalSupply(ts);
        }catch(err){
            setTotalSupply(0);
        }

        //Set tokens
        const token1 = await contract.token1();
        const token2 = await contract.token2();

        const t1Contract = new ethers.Contract(token1, erc20ABI, signer.data);
        const t2Contract = new ethers.Contract(token2, erc20ABI, signer.data);

        setT1({address: token1, name: await t1Contract.name()});
        setT2({address: token2, name: await t2Contract.name()});
    }

    useEffect(() => {
        updateInfo();
    }, [pool])

    return (
        <div className="body_container">
            <Paper elevation={3} sx={{ backgroundColor: '#101010' }}>
                <div className='swap_container'>
                    <h3>Pool Info</h3>
                    <PoolChooser setPool={setPool}/>
                    <p>{t1.name || 'Token1'} balance: {bal1.data && ethers.utils.formatEther(bal1.data.value).toString()}</p>
                    <p>{t2.name || 'Token2'} balance: {bal2.data && ethers.utils.formatEther(bal2.data.value).toString()}</p>
                    <p>Total LP tokens: {totalSupply ? ethers.utils.formatEther(totalSupply).toString() : ''}</p>
                </div>
            </Paper>
        </div>
    )
}

export default PoolInfo;