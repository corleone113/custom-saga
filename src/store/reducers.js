import {
    combineReducers
} from 'redux';
import * as actionTypes from './action-types'
const initialCounter = {number:0, number1: 0}
const initialUser={}

function counter(state = initialCounter, action) {
    switch (action.type) {
        case actionTypes.INCREMENT:
            return {...state, number:state.number+1}
        case actionTypes.DECREMENT:
            return {...state, number:state.number-1}
        case actionTypes.INCREMENT1:
            return {...state, number1:state.number1+1}
        case actionTypes.DECREMENT1:
            return {...state, number1:state.number1-1}
        default:
            return state;
    }
}
function user(state = initialUser, action) {
    switch (action.type) {
        case actionTypes.LOGIN_SUCCESS:
            return {token:action.payload}
        case actionTypes.LOGIN_ERROR:
            return {error:action.error}
        case actionTypes.LOGOUT_SUCCESS:
            return {}
        default:
            return state;
    }
}
export default combineReducers({counter,user});