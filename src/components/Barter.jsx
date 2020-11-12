import { useState, useEffect } from 'react';
import {
    useParams,
} from "react-router-dom";

import BarterGroup from './BarterGroup';

const groupNames = [
    'S',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
];

const allowedGroups = [
    'barter-items',
    'mods',
    'keys',
];

const arrayChunk = (inputArray, chunkLength) => {
    return inputArray.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / chunkLength);

        if(!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
        }

        resultArray[chunkIndex].push(item);

        return resultArray
    }, []);
};

function Barter() {
    const [items, setItems] = useState([]);
    const [updateDate, setUpdateDate] = useState(new Date());
    const {currentLoot} = useParams();
    const [nameFilter, setNameFilter] = useState('');
    const [numberFilter, setNumberFilter] = useState(244);

    useEffect(() => {
        async function fetchData(){
            let itemFilter = currentLoot;
            let dataSources = [];
            if(!currentLoot || currentLoot === 'barter'){
                itemFilter = 'barter-items';
            }

            if(itemFilter.includes(',')){
                dataSources = itemFilter
                    .split(',')
                    .filter((potentialGroup) => {
                        return allowedGroups.includes(potentialGroup);
                    });
            } else {
                dataSources.push(itemFilter);
            }

            let allItems = [];
            let result;
            for(const dataSource of dataSources){
                result = await fetch(
                    `${process.env.PUBLIC_URL}/${dataSource}.json`,
                )
                    .then(response => response.json());

                allItems = allItems.concat(result.data);
            }

            allItems = allItems.map((item) => {
                const fleaPrice = item.price - item.fee;
                let sellTo = 'Flea Market';

                if(fleaPrice <= item.traderPrice){
                    sellTo = item.trader;
                }

                return {
                    ...item,
                    sellTo: sellTo,
                    pricePerSlot: Math.floor(Math.max(fleaPrice, item.traderPrice) / item.slots),
                };
            });

            setUpdateDate(new Date(result.updated));

            const sortedItems = allItems
                .sort((itemA, itemB) => {
                    if(itemA.pricePerSlot > itemB.pricePerSlot){
                        return -1;
                    }

                    if(itemA.pricePerSlot < itemB.pricePerSlot){
                        return 1;
                    }

                    return 0;
                });

            setItems(sortedItems);
        }

        fetchData();
    }, [currentLoot, setItems]);

    const itemChunks = arrayChunk(items.slice(0, Math.min(items.length, numberFilter)), Math.min(items.length, numberFilter) / 7);

    for(let i = 0; i < itemChunks.length; i = i + 1){
        itemChunks[i] = itemChunks[i].sort((itemA, itemB) => {
            if(itemA.slots > itemB.slots){
                return -1;
            }

            if(itemA.slots < itemB.slots){
                return 1;
            }

            return 0;
        });
    };

    // console.log(displayItems)

    return <div
        className="barter-wrapper"
    >
        <div class="barter-group-wrapper filter-wrapper">
            <div
                className = {'text-label'}
            >
                {`Prices updated: ${updateDate.toLocaleDateString()}`}
            </div>
            <span>
                Filter
            </span>
            <input
                type = {'number'}
                placeholder = {'max items'}
                onChange = {e => setNumberFilter(Math.max(7, Number(e.target.value)))}
            />
            <input
                type = {'text'}
                placeholder = {'btc, graphics e.t.c'}
                onChange = {e => setNameFilter(e.target.value)}
            />
        </div>
        {itemChunks.map((items, index) =>
            <BarterGroup
                filter = {nameFilter}
                key = {`barter-group-${groupNames[index]}`}
                name = {groupNames[index]}
                items = {items}
            />
        )}
    </div>;
}

export default Barter;

