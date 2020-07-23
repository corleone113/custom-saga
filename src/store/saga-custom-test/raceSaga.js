import {take, call,race} from '@/redux-saga/effects';
import {START_RACE2} from '../action-types';
const delay = ms =>new Promise(function(resolve){
    setTimeout(()=>{
        resolve(ms);
    },ms);
});
export default function*(){
    const fromSTARTRACE2 = yield take(START_RACE2);
    console.log('from start race2:', fromSTARTRACE2);
    const result = yield race([
        call(delay, 1000),
        call(delay, 500),
    ]);
    const [a, b] = result;
    console.log('a:', a, 'b:', b, 'result:', result);
}