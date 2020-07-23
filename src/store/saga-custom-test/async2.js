import {
    delay,
    // call
    put,
    cancel,
    fork,
    cancelled,
} from '@/redux-saga/effects';


import * as types from '../action-types';

function* start() {
    try {
        while (true) {
            const r = yield put({
                type: types.DECREMENT1
            });
            const r1 = yield delay(333);
            console.log('print at async2 and delay result?', r, r1);
        }
    } finally {
        const cresult = yield cancelled();
        console.log('the cancelled result:', cresult, );
        if (cresult) {
            console.log('全体起立!!!!!!!!!!!!!!');
        }
        const nrm = yield put({
            type: types.DECREMENT1
        });
        console.log('the nrm in the custom aysn2:', nrm);
    }
}
export function* asyncDecrement() {
    try {
        const task = yield fork(start);
        const normal = yield {
            type: 'FUCK1'
        };
        console.log('>>>', normal);
        yield delay(1000);
        yield put({
            type: types.DECREMENT1
        });
        yield cancel(task);
    } catch (e) {
        console.log(e);
    }
}