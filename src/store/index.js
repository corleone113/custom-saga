import {
    createStore,
    applyMiddleware,
    compose
} from 'redux';
import createSagaMiddleware1 from '@/redux-saga'
import createSagaMiddleware from 'redux-saga'
import reducers from './reducers';
import rootSaga from './saga';
import rootSaga1 from './saga-custom-test';
// import badMiddleware from './badMiddleware';

const sagaMiddlware = createSagaMiddleware();
const sagaMiddlware1 = createSagaMiddleware1();
const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
// const store = createStore(reducers, composeEnhancer(applyMiddleware(sagaMiddlware, sagaMiddlware1, badMiddleware)));
const store = createStore(reducers, composeEnhancer(applyMiddleware(sagaMiddlware, sagaMiddlware1)));
// sagaMiddleware就是一个执行器，可以启动helloSaga这个Generator函数的执行
sagaMiddlware.run(rootSaga);
sagaMiddlware1.run(rootSaga1);
window.store = store;
export default store;