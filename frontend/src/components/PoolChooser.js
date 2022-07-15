import { MenuItem, TextField } from "@mui/material";
import { useState, useEffect } from "react";
import { useProvider } from "wagmi";
import { getPoolList } from "../utils/list";
import './PoolChooser.css';

const PoolChooser = (props) => { //setPool

    const [pools, setPools] = useState([]);
    const provider = useProvider();

    useEffect(() => {
        async function a () {
            setPools(await getPoolList(provider));
        }
        a();
    }, [])

    return (
        <div className="pool_selector">
            <h4>Choose Pool</h4>
            <TextField
                select
                label='Pool'
                variant="outlined"
                //value={props.pool}
                defaultValue={' '}
                onChange={e => { props.setPool(e.target.value); console.log('NewPool', e.target.value) }}
            >
                <MenuItem key={-1} value={' '}>
                    Select Option
                </MenuItem>
                {pools.length > 0 && pools.map((p, i) => (
                    <MenuItem key={i} value={p}>
                        Option {i}
                    </MenuItem>
                ))}
            </TextField>
        </div>
    )
}

export default PoolChooser;