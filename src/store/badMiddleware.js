import * as types from './action-types';

let done = false;
export default ({
    dispatch
}) => (next) => (action) => {
    next(action);
    const {
        type
    } = action;
    if (type === types.ASYNCINCREMENT || type === types.ASYNCDECREMENT ||
        type === types.ASYNCINCREMENT1 || type === types.ASYNCDECREMENT1) {
        console.log('try dispatch action again!');
        if (done) return;
        done = true;
        dispatch(action);
    }
}