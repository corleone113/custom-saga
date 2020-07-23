import {
    take,
    put
} from '@/redux-saga/effects'
import * as types from '../action-types'
export function* watchIncrementAsync() {
    for (let i = 0; i < 3; i++) {
        // take 监听一次ASYNCINCREMENT动作
        const action = yield take(types.ASYNCINCREMENT1);
        console.log(action);
        yield put({
            type: types.INCREMENT1
        });
    }
    console.log('最多执行三次');
}
export function* watchDecrementAsync() {
    for (let i = 0; i < 3; i++) {
        // take 监听一次ASYNCINCREMENT动作
        const action1 = yield take(types.ASYNCDECREMENT1);
        console.log(action1);
        yield put({
            type: types.DECREMENT1
        });
    }
    console.log('最多执行三次');
}