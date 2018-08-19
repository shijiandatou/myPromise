function Promise(executor) { // executor是一个执行函数
    let self = this;
    self.status = 'pending';
    self.value = undefined; // 默认成功的值
    self.reason = undefined; // 默认失败的原因
    self.onResolvedCallbacks = []; // 存放then成功的回调
    self.onRejectedCallbacks = []; // 存放then失败的回调
    function resolve(value) { // 成功状态
        if (self.status === 'pending') {
            self.status = 'resolved';
            self.value = value;
            self.onResolvedCallbacks.forEach(function (fn) {
                fn();
            });
        }
    }
    function reject(reason) { // 失败状态
        if (self.status === 'pending') {
            self.status = 'rejected';
            self.reason = reason;
            self.onRejectedCallbacks.forEach(function (fn) {
                fn();
            })
        }
    }
    try {
        executor(resolve, reject)
    } catch (e) { 
        reject(e);
    }
}
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) { 
        return reject(new TypeError('循环引用了'))
    }
    let called; 
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        try { 
            let then = x.then;
            if (typeof then === 'function') {
                then.call(x, function (y) {
                    if (called) return
                    called = true
                    resolvePromise(promise2, y, resolve, reject)
                }, function (err) { //失败
                    if (called) return
                    called = true
                    reject(err);
                })
            } else {
                resolve(x)
            }
        } catch (e) {
            if (called) return
            called = true;
            reject(e);
        }
    } else { 
        resolve(x); 
    }
}
Promise.prototype.then = function (onFulfilled, onRjected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (value) {
        return value;
    }
    onRjected = typeof onRjected === 'function' ? onRjected : function (err) {
        throw err;
    }
    let self = this;
    let promise2; 
    if (self.status === 'resolved') {
        promise2 = new Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    let x = onFulfilled(self.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            })
        })
    }
    if (self.status === 'rejected') {
        promise2 = new Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    let x = onRjected(self.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    
                    reject(e);
                }
            })

        })
    }

    if (self.status === 'pending') {
        promise2 = new Promise(function (resolve, reject) {
            self.onResolvedCallbacks.push(function () {
                setTimeout(function () {
                    try {
                        let x = onFulfilled(self.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e)
                    }
                })
            });
            self.onRejectedCallbacks.push(function () {
                setTimeout(function () {
                    try {
                        let x = onRjected(self.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                })
            });
        })
    }
    return promise2;
}

Promise.prototype.catch = function (callback) {
    return this.then(null, callback)
}
