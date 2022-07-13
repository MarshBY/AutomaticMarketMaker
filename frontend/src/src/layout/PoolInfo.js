import { ethers } from "ethers";
import { useBalance, useSigner } from "wagmi";
import constants from "../constants";
import AMM from '../AMM.json';
import { useEffect, useState } from "react";
import { Paper } from "@mui/material";

const PoolInfo = () => {

    const contractAddress = constants.contract; //To easily change later when more pools added
    const t1 = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const t2 = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

    const [totalSupply, setTotalSupply] = useState();

    const signer = useSigner();

    const bal1 = useBalance({
        addressOrName: contractAddress,
        token: t1
    })

    const bal2 = useBalance({
        addressOrName: contractAddress,
        token: t2
    })

    const updateInfo = async () => {
        const contract = new ethers.Contract(contractAddress, AMM.abi, signer.data);

        setTotalSupply(await contract.totalSupply());
    }

    useEffect(() => {
        updateInfo();
    }, [])

    return (
        <div className="body_container">
            <Paper elevation={3} sx={{ backgroundColor: '#101010' }}>
                <div className='swap_container'>
                    <h3>Pool Info</h3>
                    <p>Token1 balance: {ethers.utils.formatEther(bal1.data.value).toString()}</p>
                    <p>Token2 balance: {ethers.utils.formatEther(bal2.data.value).toString()}</p>
                    <p>Total LP tokens: {totalSupply ? ethers.utils.formatEther(totalSupply).toString() : ''}</p>
                </div>
            </Paper>
        </div>
    )
}

export default PoolInfo;