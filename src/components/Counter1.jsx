import React from 'react';
import { connect } from 'react-redux';
import {counter} from '../store/actions';
function Counter(props) {
    return (
        <>
                <br/><p>{props.number1}</p>
                <button onClick={props.increment1}>+</button>
                <button onClick={props.decrement1}>-</button>
                <button onClick={props.asyncIncrement1}>异步加1</button>
                <button onClick={props.asyncDecrement1}>异步减1</button>
                <button onClick={props.stop1}>停止自增1</button>
                <button onClick={props.startRace2}>开始race2</button>
            </>
    )
}
export default connect(
    state => state.counter,
    counter
)(Counter);