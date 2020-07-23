import React, { Component, } from 'react'
import { Provider } from 'react-redux';
import store from '../store';
import Counter from './Counter';
// import Counter1 from './Counter1';
import Login from './Login';
export default class extends Component {
    render() {
        return (
            <Provider store={store}>
                <Counter />
                <Login />
                {/* <Counter1 /> */}
            </Provider>
        )
    }

}