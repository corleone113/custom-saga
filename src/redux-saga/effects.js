export function take(actionType) {
    return {
        type: 'TAKE',
        actionType // 监听的action类型
    }
}
export function put(action) {
    return {
        type: 'PUT',
        action // 派发的action
    }
}
export function delay(wait) {
    return {
        type: 'DELAY',
        wait,
    }
}
export function select(selector, ...args) {
    return {
        type: 'SELECT',
        selector,
        args
    }
}
export function fork(task, ...args) {
    return {
        type: 'FORK',
        task, // saga任务
        args, // 携带的额外参数
    }
}
// takeEvery相当于要开启一个新的子例程，单独监听actionType
export function* takeEvery(actionType, gen) {
    function* inner(){ // 避免转码器无法识别
        while (true) {
            yield take(actionType)
            yield fork(gen);
        }
    }
    const ret = yield fork(inner)
    return ret;
}
export function call(first, ...args) {
    return {
        type: 'CALL',
        first,
        args
    }
}
export function apply(context, fn, args) {
    return call([context, fn], ...args);
}
export function cps(first, ...args) {
    return {
        type: 'CPS',
        first,
        args
    }
}
export function all(tasks) {
    return {
        type: 'ALL',
        tasks
    }
}
export function race(effects) {
    return {
        type: 'RACE',
        effects,
    }
}
export function cancel(task) {
    return {
        type: 'CANCEL',
        task
    }
}
export function cancelled(){
    return {
        type: 'CANCELLED',
    }
}