import { ethers } from "ethers";
import { useEffect, useState } from "react"
import constants from "../constants";
import AMMFactory from '../artifacts/contracts/AMMFactory.sol/AMMFactory.json'

const usePool = (t1, t2, provider) => {
    const [pool, setPool] = useState('');
    
    const factory = new ethers.Contract(constants.contract, AMMFactory.abi, provider);
    
    const getPool = async () => {
        if(t1 == '' || t2 == '') return;
        
        setPool(await factory.pools(t1, t2));
    }

    useEffect(() => {
        getPool();
    }, [t1, t2])

    return pool
}

export default usePool;