import {
    call,
} from 'redux-saga/effects';

function fn1() {
    return 'fucker';
}

export default function* testSaga() {
    const ret = yield call(fn1);
    console.log('the result:', ret);
}