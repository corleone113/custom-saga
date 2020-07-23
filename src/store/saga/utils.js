// export function readFile(filename, filename2, callback) {
//     setTimeout(() => {
//         callback(null, filename + '\'s content');
//         console.log('>>>> readFile', filename, filename2);
//     }, 1000);
//     // return 23;
// }
export function readFile2(obj1, obj2, callback) {
    console.log('the this for readFile2 is:', this);
    setTimeout(() => {
        callback(null, {...obj1,...obj2}, 44);
        // callback(null, 45, 555);
        console.log('>>> OBJ:', obj1, obj2);
    }, 1000);
    // return 23;
}
export function readFile1(filename, callback) {
    return new Promise((resolve) => {
        setTimeout(() => {
            callback(null, filename + '\'s content1');
            resolve(filename);
        }, 1000);
    })
}