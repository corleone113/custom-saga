import {
    delay,
    put,
    fork,
    cancel,
    cancelled,
} from 'redux-saga/effects';

import * as types from '../action-types';

function* start() {

    try {
        while (true) {
            const decrement1 = yield put({
                type: types.DECREMENT
            });
            const dealyRet = yield delay(333);
            console.log('print at async2 and delay result?', decrement1, dealyRet);
        }
    } finally {
        const cresult = yield cancelled();
        console.log('the cancelled result:', cresult);
        if (cresult === true) {
            console.log('cancelled');
        }
        const decrement2 = yield put({
            type: types.DECREMENT
        });
        console.log('>>>> the decrement2:', decrement2);
    }
}
export function* asyncDecrement() {
    try {
        const task = yield fork(start);
        const normal = yield {
            type: 'SOME'
        };
        console.log('>>>', normal);
        yield delay(1000);
        yield put({
            type: types.DECREMENT
        });
        yield cancel(task);
    } catch (e) {
        console.log(e);
    }
}