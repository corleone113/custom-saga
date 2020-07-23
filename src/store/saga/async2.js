import {
    delay,
    // call,
    put,
    fork,
    cancel,
    cancelled,
} from 'redux-saga/effects';

import * as types from '../action-types';

function* start() {

    try {
        while (true) {
            const r = yield put({
                type: types.DECREMENT
            });
            const r1 = yield delay(333);
            console.log('print at async2 and delay result?', r, r1);
        }
    } finally {
        const cresult = yield cancelled();
        console.log('the cancelled result:', cresult);
        if (cresult === true) {
            console.log('全体起立!!!!!!!!!!!!!!');
        }
        const ffff = yield put({
            type: types.DECREMENT
        });
        console.log('>>>> the ffff:', ffff);
    }
}
export function* asyncDecrement() {
    try {
        const task = yield fork(start);
        const normal = yield {
            type: 'FUCK'
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