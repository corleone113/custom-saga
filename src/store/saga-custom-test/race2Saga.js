import {take,put,call,race} from '@/redux-saga/effects';
import * as types from '../action-types';
const delay = ms =>new Promise(function(resolve){
    setTimeout(()=>{
        resolve(ms);
    },ms);
});
function* start(){
   while(true){
       yield call(delay,1000);
       yield put({type:types.INCREMENT1});
   }
}
export default function* rootSaga(){
  const result = yield race({
      start:call(start),
      //如果监听到了CANCEL_COUNTER动作，则表示当前任务完成，如果有一个任务完成了，就表示整体结束了。会自动取消掉其它的任务
      stop:take(types.CANCEL_COUNTER1)
  });
  console.log('the custom race2saga result:', result);
}