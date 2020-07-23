import * as actionTypes from '../action-types';
export default{
    increment(){
        return{
            type: actionTypes.INCREMENT
        }
    },
    decrement(){
        return{
            type: actionTypes.DECREMENT
        }
    },
    asyncIncrement(){
        return {
            type:actionTypes.ASYNCINCREMENT
        }
    },
    asyncDecrement(){
        return {
            type:actionTypes.ASYNCDECREMENT
        }
    },
    stop(){
        return {
            type:actionTypes.CANCEL_COUNTER
        }
    },
    stop1(){
        return {
            type:actionTypes.CANCEL_COUNTER1,
        }
    },
    increment1(){
        return{
            type: actionTypes.INCREMENT1
        }
    },
    decrement1(){
        return{
            type: actionTypes.DECREMENT1
        }
    },
    startRace1(){
        return {
            type: actionTypes.START_RACE1,
        }
    },
    startRace2(){
        return {
            type: actionTypes.START_RACE2,
        }
    },
    asyncIncrement1(){
        return {
            type:actionTypes.ASYNCINCREMENT1
        }
    },
    asyncDecrement1(){
        return {
            type:actionTypes.ASYNCDECREMENT1
        }
    },
}