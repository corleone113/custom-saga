export function nodeFn(obj1, obj2, callback) {
    console.log('the this for nodeFn is:', this);
    setTimeout(() => {
        callback(null, {...obj1,...obj2}, 44);
        console.log('>>> OBJ:', obj1, obj2);
    }, 1000);
}
export function someFn(filename, callback) {
    return new Promise((resolve) => {
        setTimeout(() => {
            callback(null, filename + '\'s content1');
            resolve(filename);
        }, 1000);
    })
}