import {
    delay,
    put,
    call,
    cps,
    takeEvery,
    // take,
    // fork,
} from '@/redux-saga/effects'


import * as types from '../action-types'
import {
    readFile1,
    readFile2
} from './utils'
import {
    asyncDecrement
} from './async2'
// workerSaga 真正执行的saga任务。
// function* anotherAsyncIncrement() {
//     // yield take(types.ASYNCDECREMENT);
//     console.log('mother fuck??');
//     yield put({
//         type: types.INCREMENT1,
//     });
//     const ret = yield call(returnForAnother);
//     return ret;

// }

// function returnForAnother(){
//     return 'corleone xlf';
// }

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
    // const msg=yield delay(1000);
    yield delay(1000);
    yield put({
        type: types.INCREMENT1
    });
    // const fn = (error, msg) => {
    //     console.log('Just successful!', msg);
    // }
    // const ress = yield cps(readFile2);
    // const ress = yield cps(readFile2,{name:'1'},{bb:'2'},(err, ...args)=>{});
    const ress = yield cps(readFile2, {
        name: '1'
    }, {
        bb: '2'
    }, )
    console.log('>>>ress', typeof ress, ress);
    // const p = yield anotherAsyncIncrement();
    const p = yield call(readFile1, 'someBB', (context, msg) => {
        console.log(context, msg);
    })
    const p1 = yield call(somePromise)
    console.log('the p:', p, p1);
    const p3 = yield anotherGen();
    console.log('the p3:', p3);
}

// function* incrementAsync1(){
//     while(true){
//         yield take(types.ASYNCINCREMENT1);
//         yield delay(1000);
//         yield put({
//             type: types.INCREMENT1
//         });
//         // const fn = (error, msg) => {
//         //     console.log('Just successful!', msg);
//         // }
//         // const ress = yield cps(readFile2);
//         // const ress = yield cps(readFile2,{name:'1'},{bb:'2'},(err, ...args)=>{});
//         const ress = yield cps(readFile2, {
//             name: '1'
//         }, {
//             bb: '2'
//         }, )
//         console.log('>>>ress', typeof ress, ress);
//         // const p = yield anotherAsyncIncrement();
//         const p = yield call(readFile1, 'someBB', (context, msg) => {
//             console.log(context, msg);
//         })
//         // const p = yield call(anotherAsyncIncrement)
//         const p1 = yield call(somePromise)
//         console.log('the p:', p, p1);
//         const p3 = yield anotherGen();
//         console.log('the p3:', p3);
//     }
// }
export function* watchCounterAsync() {
    const takeEveryR = yield takeEvery(types.ASYNCINCREMENT1, incrementAsync);
    console.log('the take every return from custom:', takeEveryR);
    // yield fork(incrementAsync1);
    yield takeEvery(types.ASYNCDECREMENT1, asyncDecrement);
}