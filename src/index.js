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
        const handleEffect = (effect, next) => {
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
                    run(newTask, {
                        fromFork: true,
                    }); // 通过saga开启的新任务，肯定是generator函数返回值，所以要用run来真正开启
                    next(newTask); // 将newTask返回，然后可以通过CANCEL effect进行取消。
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
                        effect.task.next(true);
                    })
                    next();
                    break;
                case 'CANCELLED':
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
                    if (typeof cb !== 'function') {
                        const cb = (err, msg) => {
                            try {
                                if (err) throw err;
                                next(msg);
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
                            fromRaceGen.forEach(g => {
                                g.return();
                                fromRaceGen.delete(g);
                            });
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
                    setTimeout(() => next(true), effect.wait);
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

        const run = (generator, {
            next: callback,
            fromFork,
        } = {}) => {
            const it = typeof generator[Symbol.iterator] == 'function' ? generator : generator();
            fromRace && fromRaceGen.add(it);
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
                            handleEffect(effect, next);
                        }
                    } else if (typeof callback === 'function') {
                        callback(effect)
                    }
                }
                if (fromFork) {
                    setTimeout(innerCall);
                } else {
                    innerCall();
                }
            }
            next();
        }
        sagaMiddleware.run = (g) => run(g); // 返回的sagaMiddleware的run方法不支持回调
        return next => action => {
            channel.publish(action);
            return next(action);
        }
    }
    return sagaMiddleware;
}
export default createSagaMiddleware;