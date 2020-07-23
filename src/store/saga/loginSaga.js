import {
    put,
    call,
    take,
    fork,
    cancel,
    cancelled
} from 'redux-saga/effects';
import * as types from '../action-types';
// import {delay} from '../utils';
import Api from './Api';

function* login(username, password) {
    try {
        Api.setItem('loading', 'true');
        const token = yield call(Api.login, username, password);
        yield put({
            type: types.LOGIN_SUCCESS,
            payload: token
        });
        Api.setItem('loading', 'false');
    } catch (error) {
        alert(error);
        yield put({
            type: types.LOGIN_ERROR,
            error
        });
        yield put({
            type: types.LOGOUT
        });
        Api.setItem('loading', 'false');
    } finally {
        const canceled = yield cancelled();
        if (canceled) {
            Api.setItem('loading', 'false');
            console.log('test cancelled:', canceled);
        }
    }
}
// let task
export function* watchLogin() {
    while (true) {
        const {
            payload: {
                username,
                password
            }
        } = yield take(types.LOGIN);
        //const token = yield call(login,username,password);
        //fork就相当于开启了一个子进程，他会单独去执行而不会影响当前的主进程，主进程会立刻向下执行
        //我们拿 不到login的返回值，但是可以得到一个任务对象的  
        const task = yield fork(login, username, password);
        console.log('the task', task);
        const action=yield take(types.LOGOUT);
        //派发一个退出成功的动作，把 token删除掉
        if (action) {
            yield cancel(task);
        }
        yield put({
            type: types.LOGOUT_SUCCESS
        });
    }
}

// export function* watchLogout() {
//     while (true) {
//         yield take(types.LOGOUT);
//         console.log('<<<<<')
//         //派发一个退出成功的动作，把 token删除掉
//         if (task) {
//             console.log('>>>>>')
//             yield cancel(task);
//         }
//         yield put({
//             type: types.LOGOUT_SUCCESS
//         });
//     }
// }