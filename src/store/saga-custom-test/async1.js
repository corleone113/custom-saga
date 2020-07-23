import {
    delay,
    put,
    call,
    cps,
    takeEvery,
} from '@/redux-saga/effects'

import * as types from '../action-types'
import {
    someFn,
    nodeFn
} from './utils'
import {
    asyncDecrement
} from './async2'
function* anotherGen() {
    yield delay(1000);
    yield put({type: types.INCREMENT1});
    return 'ppp';
}

async function somePromise() {
    const a = await new Promise(resolve=>{
        setTimeout(()=>resolve(11), 1000);
    });
    const b = await a * 10;
    return 'im corleone xiao' + b;
}

function* incrementAsync() {
    yield delay(1000);
    yield put({
        type: types.INCREMENT1
    });
    // const ret = yield cps(nodeFn);
    // const ret = yield cps(nodeFn,{name:'1'},{bb:'2'},(err, ...args)=>{});
    const ret = yield cps(nodeFn, {
        name: '1'
    }, {
        bb: '2'
    }, )
    console.log('ret:', typeof ret, ret);
    const p = yield call(someFn, 'someBB', (context, msg) => {
        console.log(context, msg);
    })
    const p1 = yield call(somePromise)
    console.log('the p:', p, p1);
    const p3 = yield anotherGen();
    console.log('the p3:', p3);
}
export function* watchCounterAsync() {
    yield takeEvery(types.ASYNCINCREMENT1, incrementAsync);
    yield takeEvery(types.ASYNCDECREMENT1, asyncDecrement);
}