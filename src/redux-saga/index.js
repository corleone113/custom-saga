import { transform } from '@babel/core'; // 错误提示做得比babylon好一点
import * as t from '@babel/types';

const channel = createChannel(); // channel对象用于缓存/执行那些订阅了某个action的回调
const raceEffectToSaga = new Map(); // 缓存由于RACE Effect产生的新的saga迭代器。
const raceEffectStask = [];
let fromRace = false; // 标识RACE Effect是否正在启动其中的effect
let dispatch, getState; // 保存来自store.dispatchh和store.getState

function createSagaMiddleware() {
  const sagaMiddleware = (store) => {
    ({ dispatch, getState } = store);
    return (next) => (action) => {
      channel.publish(action); // 调用action对应的回调——进行saga下一步。
      return next(action);
    };
  };
  sagaMiddleware.run = (g) => run(g); // 返回的sagaMiddleware的run方法不支持回调(暂定)
  return sagaMiddleware;
}

function run(
  saga,
  {
    // 第二个参数改为选项对象，方便扩展
    next: endTask,
    fromFork,
  } = {}
) {
  const it = typeof saga[Symbol.iterator] == 'function' ? saga : saga();
  fromRace && raceEffectToSaga.set(raceEffectStask.pop(), it); // 缓存由于RACE Effect产生的新的saga迭代器。
  let iteractionCount = 0; // 记录saga执行次数
  if (fromFork) {
    // 若为fork产生的新saga任务，则推迟到下一轮事件循环启动。
    setTimeout(next);
  } else {
    next();
  }

  function next(nextValue) {
    // saga执行器，要引用很多局部变量，所以定义在内部
    ++iteractionCount;
    if (iteractionCount >= 1000)
      // 迭代次数阈值为1000，防止短时间内连续执行多次
      return;
    const { done, value: effect } = it.next(nextValue); // 将yield表达式结果作为内部yield返回值
    if (!done) {
      if (!effect) {
        // 非对象/函数则直接进行下一步且在saga内部返回该值
        next(effect);
      } else if (typeof effect[Symbol.iterator] == 'function') {
        // 可能是新的saga任务
        run(effect, {
          next,
        });
      } else if (typeof effect.then == 'function') {
        // 是promise则等待其结束再进行后续
        effect.then(next);
      } else if (!effect.type) {
        // 无效的effect也直接进行下一步且该值作为内部yield返回值
        next(effect);
      } else {
        // 到这里说明是有效的effect，然后根据effect进行相应的操作。
        handleEffect(effect, next, it);
      }
    } else if (typeof endTask === 'function') {
      endTask(effect);
    }
  }
}

function handleEffect(effect, next, currentTask) {
  let first, args, fn, context;
  switch (effect.type) {
    case 'TAKE': // 起到一个暂停作用，暂停后对应action派发时才继续saga任务。
      channel.subscribe(effect.actionType, next);
      break;
    case 'PUT': // 派发一个action，触发redux同步数据更新
      dispatch(effect.action);
      next(effect.action); // 派发action后继续saga任务且该action作为内部yield返回值。
      break;
    case 'FORK': // 开启一个新的saga任务
      const { task, args: a } = effect;
      const newTask = task.call(effect, ...a); // 获取saga任务迭代器，执行saga时传入effect携带的参数
      // eslint-disable-next-line no-eval
      const gen = eval(
        transform(task.toString(), {
          // 通过finalTaskPlugin将任务中finally语句转化为一个generator回调在CANCELLED Effect中调用，目前CANCELLED EFFECT的实现方式有问题，后续完整阅读了redux-saga源码后再修改。
          plugins: [finalTaskPlugin],
        }).code
      );
      gen && (newTask.finalJob = gen.bind(effect, ...a)); // generator回调作为saga任务执行结束时的回调。
      next(newTask); // 进行下一步，且saga任务作为内部yield返回值，然后可以通过CANCEL Effect进行取消。
      run(newTask, {
        // 传入saga任务迭代器，通过run启动新的saga任务
        fromFork: true, // 标识通过FORK Effect新启动的saga任务
      });
      break;
    case 'CALL': // 执行一个函数并获取其结果作为内部yield返回值
      ({
        first, // 代表第一个参数，可能时回调或数组(含有作为绑定的this参数的元素)
        args, // 执行回调时传入的参数
      } = effect);
      ({ fn, context } = getCallbackFromFirst(first)); // 获取有效的回调和为其绑定的this参数
      const ret = fn.call(context, ...args); // 执行回调并保存其结果
      if (typeof ret[Symbol.iterator] === 'function') {
        run(ret, {
          // 是genenrator函数时则开启新saga任务，等待其执行完后再进行后续并将其return结果作为内部yield返回值。
          next,
        });
      } else if (typeof ret.then === 'function') {
        // thenable或promise则等待其结束时进行下一步，异步结果作为内部yield返回值。
        ret.then(next);
      } else {
        next(ret); // 其它类型则直接进行下一步
      }
      break;
    case 'CANCEL': // 取消指定任务
      setTimeout(() => {
        effect.task.return(); // 延迟到下一轮事件循环中进行取消
        effect.task.cancelled = true; // 标识该任务已经取消
      });
      next(); // 继续进行下一步
      break;
    case 'CANCELLED': // 判断当前saga任务是否已经取消
      const { cancelled, finalJob: g } = currentTask;
      if (cancelled && typeof g === 'function') {
        // saga任务已经取消且finalJob存在则运行finalJob回调
        return run(g); // 这是一个saga任务，需要通过run来启动
      }
      next(false); // saga任务未取消则继续下一步
      break;
    case 'CPS': // 调用nodejs风格的函数
      ({ first, args } = effect);
      ({ fn, context } = getCallbackFromFirst(first)); // 这几步和上面CALL Effect中一样
      const { length } = args;
      const cb = args[length - 1]; // 获取传入回调的最后一个参数，这个参数应该是一个回调
      if (typeof cb !== 'function') {
        // 最后一个参数不为回调则主动提供一个回调作为最后一个参数。
        const cb = (err, msg) => {
          try {
            if (err) throw err; // 传入一个参数说明报错了
            next(msg); // 没有报错则继续当前saga任务——通过CPS Effect执行函数时，只有函数为nodejs风格且执行时没有提供最后一个回调才会继续saga任务。
          } catch (e) {
            console.error(e);
          }
        };
        args.push(cb);
      }
      fn.call(context, ...args); // 执行函数
      break;
    case 'ALL': // 用于启动多个saga
      effect.tasks.forEach((task) => run(task)); //
      next();
      break;
    case 'RACE': // 批量处理多个effect，但只要有一个effect执行完就以其结果作为内部yield返回值并中断其它effect的处理。
      const { effects } = effect;
      if (typeof effects === 'object') {
        const arr = Array(effects.length).fill(void 0); // 当effects为数组时保存结果的数组
        const raceCallback = (k, isArr) => (v) => {
          // raceCallback是RACE Effect开启的每个effect处理结束时的回调
          isArr && (arr[k] = v); // 根据isArr决定是否将结果保存在数组中
          next(
            isArr
              ? arr
              : {
                  // 继续当前saga下一步并根据isArr决定内部yield返回值
                  [k]: v,
                }
          );
          raceEffectToSaga.forEach((saga, raceEffect) => {
            // 取消同一个race任务发起的其它effect的saga。
            if (raceEffect === effect) {
              saga.return();
              raceEffectToSaga.delete(raceEffect); // 在缓存中删除该effect对应的记录。
            }
          });
        };
        fromRace = true; // 从现在开始处理的effect都来自RACE Effect
        raceEffectStask.push(effect);
        if (Array.isArray(effects)) {
          // 批量处理的effect保存在数组中
          for (let i = 0; i < effects.length; ++i) {
            handleEffect(effects[i], raceCallback(i, true));
          }
        } else {
          // 批量处理的effect保存在对象中
          for (const k in effects) {
            handleEffect(effects[k], raceCallback(k));
          }
        }
        fromRace = false; // 来自RACE Effect的effects都启动完毕
      } else {
        throw new Error('Expected effects passed to race is a object or array');
      }
      break;
    case 'DELAY': // 延迟指定时间后进行下一步
      setTimeout(() => {
        next(true); // 内部yield返回值为true
      }, effect.wait);
      break;
    case 'SELECT': // 获取当前state并用指定回调处理。
      const { selector, args: rest } = effect;
      next(selector(getState(), ...rest));
      break;
    default:
      // 无法识别的effect则直接开启下一步并以该effect作为内部yield返回值。
      next(effect);
      break;
  }
}

function createChannel() {
  const observer = {};

  const subscribe = (actionType, callback) => {
    // 订阅actionType对应的回调
    observer[actionType] = callback;
  };

  const publish = (action) => {
    // 执行完不需要清理actionType对应的回调，因为该回调就是saga执行器，再次执行也就是继续saga后续任务，而saga effect中只有TAKE Effect有暂停功能，所以再次执行时如果还有后续代码的话说明之前已经遇到过携带相同actionType的TAKE Effect，即重新订阅过，这时actionType对应的回调也被覆盖过了。
    observer[action.type] && observer[action.type](action);
  };
  return {
    subscribe,
    publish,
  };
}

function getCallbackFromFirst(first) {
  // 用于尝试从first获取有效的回调和为其绑定的this参数。
  let fn, context;
  if (Array.isArray(first)) {
    [context, fn] = first;
    if (typeof fn !== 'function') {
      throw new Error(
        `Expected the second element of the first array argument passed to caller is a function.`
      );
    }
  } else if (typeof first === 'function') {
    fn = first;
    context = null;
  } else {
    throw new Error(
      `Expected first argument passed to caller to be a function or array.`
    );
  }
  return {
    fn,
    context,
  };
}

function finalTaskPlugin() {
  return {
    // 将finally语句转化为回调函数
    visitor: {
      FunctionDeclaration(path) {
        const {
          node: { params },
        } = path;
        path.traverse({
          TryStatement(tryPath) {
            // 进入try语句
            const { finalizer } = tryPath.node;
            if (finalizer && finalizer.body.length > 0) {
              // 具有finally语句且语句中含有代码
              // 用saga的参数和finally语句中的代码块创建一个generator函数表达式
              const finalGen = t.functionExpression(
                null,
                params,
                t.blockStatement(finalizer.body),
                true
              );
              path.replaceWith(finalGen); // 替换原始函数
            }
          },
        });
      },
    },
  };
}
export default createSagaMiddleware;
