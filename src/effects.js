export function take(actionType) {
    return {
        type: 'TAKE',
        actionType
    }
}
export function put(action) {
    return {
        type: 'PUT',
        action
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
        task,
        args,
    }
}
// takeEvery相当于要开启一个新的子例程，单独监听actionType
export function* takeEvery(actionType, gen) {
    const ret = yield fork(function* () {
        while (true) {
            yield take(actionType)
            yield fork(gen);
        }
    })
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