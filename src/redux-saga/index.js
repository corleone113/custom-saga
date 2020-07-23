import {
    transform
} from '@babel/core'; // 错误提示做得比babylon好一点
import * as t from '@babel/types';
import * as effectRoot from './effects';
const finalTaskPlugin = {// 将finally语句转化为回调函数
    visitor: {
        FunctionDeclaration(path) {
            const {
                parent: {
                    type
                },
                node: {
                    generator,
                    params,
                },
            } = path;
            if (type === 'Program' && generator) {
                path.traverse({
                    TryStatement(tryPath) {
                        const {
                            finalizer
                        } = tryPath.node
                        if (finalizer && finalizer.body.length > 0) {
                            const finalGen = t.functionExpression(null, params, t.blockStatement(finalizer.body), true)
                            path.replaceWith(finalGen);
                            path.traverse({
                                MemberExpression(memberPath) {
                                    const {
                                        node: {
                                            object: {
                                                name
                                            },
                                        },
                                        parentPath,
                                        parent: {
                                            type
                                        }
                                    } = memberPath;
                                    if (/__WEBPACK_IMPORTED_MODULE_/.test(name)) {// 替换webpack转化的代码
                                        const {
                                            node: {
                                                property: {
                                                    extra: {
                                                        rawValue
                                                    }
                                                }
                                            },
                                        } = memberPath
                                        if (type === 'CallExpression') {
                                            if (rawValue === 'cancelled') {
                                                parentPath.replaceWith(t.arrowFunctionExpression([], t.booleanLiteral(true)))
                                            } else {
                                                parentPath.replaceWith(t.identifier(`this.${rawValue}`));
                                            }
                                        }
                                        if (type === 'ObjectProperty') {
                                            memberPath.replaceWith(t.stringLiteral(rawValue));
                                        }
                                    }
                                }
                            })
                        }
                    },
                }, );
            } else {
                path.replaceWith([]);
            }
        }
    }
}
const createChannel = () => {
    const observer = {};

    const subscribe = (actionType, callback) => {
        observer[actionType] = callback;
    }

    const publish = (action) => {
        // 不需要执行完后取消订阅，因为每次是派发action后都是现在next方法中进行订阅，订阅后就覆盖之前的observer[action.type]了，createChannel和下面产生的channel实例是内部才可用，不用担心会多次执行observer[action.type]
        observer[action.type] && observer[action.type](action);
    }
    return {
        subscribe,
        publish
    };
}
const createSagaMiddleware = () => {
    const channel = createChannel();
    const sagaMiddleware = ({
        dispatch,
        getState
    }) => {
        const getCallbackFromFirst = (first) => {
            let fn, context;
            if (Array.isArray(first)) {
                [context, fn] = first;
                if (typeof fn !== 'function') {
                    throw new Error(`Expected the second element of the first array argument passed to caller is a function.`)
                }
            } else if (typeof first === 'function') {
                fn = first;
                context = null;
            } else {
                throw new Error(`Expected first argument passed to caller to be a function or array.`)
            }
            return {
                fn,
                context
            };
        }
        const fromRaceGen = new Set();
        let fromRace = false;
        const handleEffect = (effect, next, currentTask) => {
            let first, args, fn, context;
            switch (effect.type) {
                case 'TAKE':
                    channel.subscribe(effect.actionType, next);
                    break;
                case 'PUT':
                    dispatch(effect.action);
                    next(effect.action);
                    break;
                case 'FORK':
                    const {
                        task, args: a
                    } = effect;
                    const newTask = task.call(effect, ...a);
                    // eslint-disable-next-line no-eval
                    const gen = eval(transform(task.toString(), {
                        plugins: [
                            finalTaskPlugin,
                        ]
                    }).code);
                    gen && (newTask.finalJob = gen.bind(effectRoot, ...a));// 为最终的回调绑定作用域(effect api作用域)。
                    next(newTask); // 将newTask返回，然后可以通过CANCEL effect进行取消。
                    run(newTask, { // 通过run启动新的saga任务
                        fromFork: true,
                    });
                    break;
                case 'CALL':
                    ({
                        first,
                        args
                    } = effect);
                    ({
                        fn,
                        context
                    } = getCallbackFromFirst(first));
                    const ret = fn.call(context, ...args);
                    if (typeof ret[Symbol.iterator] === 'function') {
                        run(ret, {
                            next
                        }); // 是genenrator函数时
                    } else if (typeof ret.then === 'function') {
                        ret.then(next);
                    } else {
                        next(ret);
                    }
                    break;
                case 'CANCEL':
                    setTimeout(() => {
                        effect.task.return();
                        effect.task.cancelled = true;
                    }, );
                    next();
                    break;
                case 'CANCELLED':
                    const {
                        cancelled, finalJob: g
                    } = currentTask;
                    if (cancelled && typeof g === 'function') { // saga任务已经取消且finalJob存在则运行finalJob回调
                        run(g);
                    }
                    next(false);
                    break;
                case 'CPS':
                    ({
                        first,
                        args
                    } = effect);
                    ({
                        fn,
                        context
                    } = getCallbackFromFirst(first, 'cps'));
                    const {
                        length,
                    } = args;
                    const cb = args[length - 1];
                    if (typeof cb !== 'function') {// 最后一个参数不为回调则在参数列表中添加一个回调。
                        const cb = (err, msg) => {
                            try {
                                if (err) throw err;
                                next(msg); // 使用saga提供的回调则会执行cps effect后面的代码。
                            } catch (e) {
                                console.error(e);
                            }
                        }
                        args.push(cb);
                    }
                    fn.call(context, ...args);
                    break;
                case 'ALL':
                    effect.tasks.forEach(task => run(task));
                    next();
                    break;
                case 'RACE':
                    const {
                        effects
                    } = effect;
                    if (typeof effects === 'object') {
                        let arr;
                        const cb = (k, isArr) => (v) => {
                            isArr && (arr[k] = v);
                            next(isArr ? arr : {
                                [k]: v
                            });
                            const genCache = []
                            fromRaceGen.forEach(g => {
                                g.return();// 一个saga任务有了结果则取消其它任务。
                                genCache.push(g);
                            });
                            for (const g of genCache) {
                                fromRaceGen.delete(g);
                            }
                        }
                        fromRace = true;
                        if (Array.isArray(effects)) {
                            arr = Array(effects.length).fill(void 0);
                            for (let i = 0; i < effects.length; ++i) {
                                handleEffect(effects[i], cb(i, true));
                            }
                        } else {
                            for (const k in effects) {
                                handleEffect(effects[k], cb(k));
                            }
                        }
                        fromRace = false;
                    } else {
                        throw new Error('Expected effects passed to race is a object or array');
                    }
                    break;
                case 'DELAY':
                    setTimeout(() => {
                        next(true);
                    }, effect.wait);
                    break;
                case 'SELECT':
                    const {
                        selector, args: rest
                    } = effect;
                    next(selector(getState(), ...rest));
                    break;
                default:
                    next(effect);
                    break;
            }
        }

        const run = (generator, {// 第二个参数改为选项对象，方便扩展
            next: callback,
            fromFork,
        } = {}) => {
            const it = typeof generator[Symbol.iterator] == 'function' ? generator : generator();
            fromRace && fromRaceGen.add(it);// 缓存来自race effect的saga任务。
            let recursiveCount = 0;
            const next = (nextValue) => {
                ++recursiveCount;
                if (recursiveCount >= 1000)
                    return;
                const innerCall = () => {
                    const {
                        done,
                        value: effect
                    } = it.next(nextValue);
                    if (!done) {
                        if (!effect) {
                            next(effect);
                        } else if (typeof effect[Symbol.iterator] == 'function') {
                            run(effect, {
                                next
                            });
                        } else if (typeof effect.then == 'function') {
                            effect.then(next);
                        } else if (!effect.type) {
                            next(effect);
                        } else {
                            handleEffect(effect, next, it);
                        }
                    } else if (typeof callback === 'function') {
                        callback(effect)
                    }
                }
                if (fromFork) {// 若为fork产生的新saga任务，则每一步都推迟到宏任务中。
                    setTimeout(innerCall);
                } else {
                    innerCall();
                }
            }
            next();
        }
        sagaMiddleware.run = (g) => run(g); // 返回的sagaMiddleware的run方法不支持回调(暂定)
        return next => action => {
            channel.publish(action);
            return next(action);
        }
    }
    return sagaMiddleware;
}
export default createSagaMiddleware;