function Promise(executor){ //executor 是一个执行函数
    let selft = this;
    self.status = 'pending';
    self.value = undefined; // 默认成功的值
    self.reason = undefined; //默认失败的原因
    self.onResolveCallbacks = []; //存放then成功的回调
    self.onRejectedCallbacks = []; //存放then失败的回调
    function resolve(value){ //成功状态
        if(self.status === 'pending'){
            self.status = 'resolved';
            self.value = value;
            self.onResolveCallbacks.forEach(function(fn){
                fn();
            })
        }
    };
    function reject(reason){ //失败状态
        if(self.status === 'pending'){
            self.status = 'rejected';
            self.reason = reason;
            self.onRejectedCallbacks.forEach(function(fn){
                fn();
            })
        }
    };
    try{
        executor(resolve,reject)
    }catch(e){ //捕获的时候发生异常，就直接失败了
        reject(e)
    }

};
//then方法 进行链式调用
Promise.prototype.then=function(onFulfilled,onRejected){
    //成功和失败默认不传给一个函数
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function(value){
        return value;
    };
    onRejected = typeof onRejected === 'function' ? onRejected : function(err){
        throw err;
    }
    let self = this;
    let promise2; // 返回的promise；
    if(self.status === 'resolved'){
        promise2 = new Promise(function(resolve,reject){
            setTimeout(function(){
                try{
                    let x = onFulfilled(self.value);
                    //x 可能是别人promise 写一个方法统一处理
                    resolvePromise(promise2,x,resolve,reject);
                }catch(e){
                    reject(e);
                }   
            });
        })
    };
    if(self.status === 'rejectde'){
        promise2 = new Promise(function(resolve,reject){
            setTimeout(function(){
                try{
                    let x = onRejected(self.reason);
                    resolvePromise(promise2,x,resolve,reject);
                }catch(e){
                    reject(e);
                }
            })
        })
    };
    //当调用then时 可能没有成功 也没有失败
    if(self.status === 'pending'){
        promise2 = new Promise(function(resolve,reject){
            //此时没有resolve 也没有reject
            self.onRejectedCallbacks.push(function(){
                setTimeout(function(){
                    try{
                        let x = onFulfilled(self.value);
                        resolvePromise(promise2,x,resolve,reject);
                    }catch(e){
                        reject(e);
                    }
                })
            })
        });
        self.onRejectedCallbacks.push(function(){
            setTimeout(function(){
                try{
                    let x = onRejected(self.reason);
                    resolvePromise(promise2,x,resolve,reject);
                }catch(e){
                    reject(e);
                }
            })
        })

    };
    return promise2;
};

function resolvePromise(promise2,x,resolve,reject){
    if(promise2 === x){
        return reject(new TypeError('循环引用了'));
    };
    let called;
    if(x !== null && (typeof x === 'object' || typeof x === 'function')) {
        try{
            let then = x.then;
            if(typeof then === 'function'){
                then.call(x,function(y){
                    if(called) return;
                    called = true;
                    resolvePromise(promise2,y,resolve,reject);
                },function(err){
                    if(called) return;
                    called = true
                    reject(err);
                })
            }else{
                resolve(x);
            }
        }catch(e){
            if(called) return;
            called = true;
            reject(e);
        }
    }else{
        resolve(x);
    }
}