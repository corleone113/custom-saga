import {
    all
} from 'redux-saga/effects'

// import {
//     watchIncrementAsync,
//     watchDecrementAsync
// } from './counterSaga'
import {watchCounterAsync} from './async1'
import {
    watchLogin
} from './loginSaga'
import raceSaga from './raceSaga'
import reace2Saga from './race2Saga'

// watcherSaga 监听向仓库派发动作的，蒋婷到某些动作会通过workerSaga去执行

// rootSaga 是saga用来组织和调用别的saga generator函数
export default function* rootSaga() {
    yield all([
        raceSaga(),
        reace2Saga(),
        watchLogin(),
        // watchIncrementAsync(),
        // watchDecrementAsync(),
        watchCounterAsync(),
    ]);
}