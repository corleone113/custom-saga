import React from 'react'
import { connect } from 'react-redux';
import {counter} from '../store/actions'
function Counter(props) {
        return (
            <>
                <p>{props.number}</p>
                <button onClick={props.increment}>+</button>
                <button onClick={props.decrement}>-</button>
                <button onClick={props.asyncIncrement}>异步加1</button>
                <button onClick={props.asyncDecrement}>异步减1</button>
                <button onClick={props.stop}>停止自增</button>
                <button onClick={props.startRace1}>开始race1</button>
            </>
        )

}
export default connect(
    state => state.counter,
    counter
)(Counter);