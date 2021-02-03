export function take(actionType) {
  // 暂停并监听action派发，派发了指定action后才会进行saga任务的下一步
  return {
    type: 'TAKE',
    actionType, // 监听的action类型
  };
}
export function put(action) {
  return {
    type: 'PUT',
    action, // 派发的action
  };
}
export function delay(wait) {
  return {
    type: 'DELAY',
    wait,
  };
}
export function select(selector, ...args) {
  // selector是一个使用当前state的回调，它收到的第一个参数为state，而之后参数为select调用时selector之后的参数。
  return {
    type: 'SELECT',
    selector,
    args,
  };
}
export function fork(task, ...args) {
  return {
    type: 'FORK',
    task, // saga任务
    args, // 携带的额外参数
  };
}
// takeEvery相当于要开启一个新的子例程，单独监听actionType
export function* takeEvery(actionType, gen) {
  function* inner() {
    // 避免转码器无法识别
    while (true) {
      yield take(actionType);
      yield fork(gen);
    }
  }
  const ret = yield fork(inner);
  return ret;
}
export function call(first, ...args) {
  return {
    type: 'CALL',
    first,
    args,
  };
}
export function apply(context, fn, args) {
  // apply是call的语法糖
  return call([context, fn], ...args);
}
export function cps(first, ...args) {
  // 调用node风格的回调
  return {
    type: 'CPS',
    first,
    args,
  };
}
export function all(tasks) {
  // 并发启动多个saga任务
  return {
    type: 'ALL',
    tasks,
  };
}
export function race(effects) {
  // 并发处理多个effect，可能会产生新的saga任务。一旦一个effect处理完就停止所有的effect处理。
  return {
    type: 'RACE',
    effects,
  };
}
export function cancel(task) {
  // 取消saga任务。
  return {
    type: 'CANCEL',
    task,
  };
}
export function cancelled() {
  return {
    type: 'CANCELLED',
  };
}
